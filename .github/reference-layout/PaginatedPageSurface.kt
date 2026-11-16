package com.avstaim.listai.feature.reader.bookview

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.os.Trace
import android.text.Layout
import android.text.StaticLayout
import android.text.TextUtils
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.asImageBitmap
import androidx.core.graphics.withTranslation
import androidx.core.graphics.withSave
import androidx.core.graphics.createBitmap
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.avstaim.listai.core.designsystem.PlyosTypefaceFamily
import com.avstaim.listai.core.model.BookHighlight
import com.avstaim.listai.core.model.HighlightColor
import com.avstaim.listai.core.model.BookTextRange
import com.avstaim.listai.core.model.BookLocation
import com.avstaim.listai.core.model.BlockId
import com.avstaim.listai.core.model.BookBlock
import com.avstaim.listai.core.model.BookDocument
import com.avstaim.listai.core.model.PageId
import com.avstaim.listai.core.model.plainText
import com.avstaim.listai.feature.reader.demo.DemoPageKind
import com.avstaim.listai.feature.reader.BookImagePreview
import com.avstaim.listai.reader.pagination.BlockMeasurement
import com.avstaim.listai.reader.pagination.LayoutKey
import com.avstaim.listai.reader.pagination.PageKind
import com.avstaim.listai.reader.pagination.PageLayout
import com.avstaim.listai.reader.pagination.PageMode
import com.avstaim.listai.reader.pagination.readingFlow
import com.avstaim.listai.reader.rendering.cache.WeightedLruCache
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive
import java.util.Locale
import kotlin.math.floor
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sqrt

internal const val PAGE_CACHE_BYTES = 64L * 1024 * 1024
internal const val MEASUREMENT_CACHE_BYTES = 4L * 1024 * 1024
private const val HOT_SURFACES_BYTES = 48L * 1024 * 1024

/** Published bitmaps are immutable by ownership. Never recycle a bitmap retained by a scene/GPU. */
internal class PaginatedPageSurface(val pageId: PageId, val bitmap: Bitmap, val accessibleText: String,
    val darkTheme: Boolean = false, private val key: LayoutKey? = null,
    private val footer: PreparedPageReadingFooter? = null,
    val noteLinks: List<PreparedNoteLink> = emptyList(),
    val noteReturns: List<PreparedNoteReturn> = emptyList(),
    private val returnInk: List<PreparedNoteReturnInk> = emptyList(),
    private val typefaces: PlyosTypefaceFamily = PlyosTypefaceFamily.systemSerif,
    val kind: PageKind = PageKind.TEXT,
    val images: List<PreparedBookImage> = emptyList(),
    val fixedPages: List<PreparedPdfPage> = emptyList(),
    val textCells: List<PreparedTextCell> = emptyList(),
    private val selectableBlockIds: Set<BlockId> = emptySet(),
) {
    private var lastHighlights: List<BookHighlight>? = null
    private var lastSelection: BookTextRange? = null
    private var lastSpeech: BookTextRange? = null
    private val highlightPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private var highlightInk by mutableStateOf<List<Pair<Rect, Int>>>(emptyList())
    fun updateHighlights(highlights: List<BookHighlight>, selection: BookTextRange?, speech: BookTextRange? = null) {
        if (lastHighlights == highlights && lastSelection == selection && lastSpeech == speech) return
        lastHighlights = highlights.toList(); lastSelection = selection; lastSpeech = speech
        highlightInk = mergeHighlightInk(buildList {
            for (highlight in highlights.filter { it.range.start.blockId in selectableBlockIds && it.range.endExclusive.blockId in selectableBlockIds }) for (cell in textCells) if (cell.inRange(highlight.range)) {
                val color = when (highlight.color) {
                    HighlightColor.BLUE -> 0x665DABEC
                    HighlightColor.GREEN -> 0x666BBE91
                    HighlightColor.AMBER -> 0x66E5BB54
                    HighlightColor.VIOLET -> 0x66AC8DDD
                }
                add(cell.bounds to color)
            }
            if (selection != null && selection.start.blockId in selectableBlockIds && selection.endExclusive.blockId in selectableBlockIds) for (cell in textCells) if (cell.inRange(selection)) add(cell.bounds to 0x8871B8EE.toInt())
            // Speech is transient source ink, independent of persisted marks and selection.
            // Reuse prepared glyph cells so engine range callbacks never remeasure text.
            if (speech != null && speech.start.blockId in selectableBlockIds && speech.endExclusive.blockId in selectableBlockIds)
                for (cell in textCells) if (cell.inRange(speech)) add(cell.bounds to 0x8871B8EE.toInt())
        })
    }
    val byteCount: Long get() = bitmap.allocationByteCount.toLong()
    val footerText: String? get() = footer?.text
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)

    fun drawTo(canvas: Canvas, bounds: RectF, alpha: Float = 1f) {
        paint.alpha = (alpha.coerceIn(0f, 1f) * 255).toInt()
        if (key != null && highlightInk.isNotEmpty()) canvas.withSave {
            canvas.translate(bounds.left, bounds.top)
            canvas.scale(bounds.width() / key.pageWidthPx, bounds.height() / key.pageHeightPx)
            val ink = highlightPaint
            highlightInk.forEach { (rect, color) ->
                ink.color = color; ink.alpha = (android.graphics.Color.alpha(color) * alpha).toInt()
                canvas.drawRect(rect.left, rect.top, rect.right, rect.bottom, ink)
            }
        }
        canvas.drawBitmap(bitmap, null, bounds, paint)
        // The footer uses the same native page transform as its text, including the moving back.
        // It is prepared at publication time, never measured from the draw/curl path.
        if (key != null && (footer != null || returnInk.isNotEmpty())) canvas.withSave {
            canvas.translate(bounds.left, bounds.top)
            canvas.scale(bounds.width() / key.pageWidthPx, bounds.height() / key.pageHeightPx)
            footer?.drawTo(canvas, paint.alpha)
            returnInk.forEach { it.drawTo(canvas, paint.alpha) }
        }
    }

    fun withFooter(value: PageReadingFooter): PaginatedPageSurface {
        if (kind != PageKind.TEXT) return this
        val layoutKey = requireNotNull(key)
        // Progress can change without changing the visible page label. Pinned wrappers retain
        // their own prepared ruler when a newer pagination snapshot supplies another footer.
        if (value == footer?.value) return this
        return PaginatedPageSurface(pageId, bitmap, accessibleText, darkTheme, layoutKey,
            PreparedPageReadingFooter(value, layoutKey, darkTheme, typefaces), noteLinks, noteReturns,
            returnInk, typefaces, kind, images, fixedPages, textCells, selectableBlockIds)
    }

    fun withNoteReturns(values: List<PreparedNoteReturn>): PaginatedPageSurface {
        if (values == noteReturns) return this
        val layoutKey = requireNotNull(key)
        val published = values.toList()
        return PaginatedPageSurface(pageId, bitmap, accessibleText, darkTheme, layoutKey, footer,
            noteLinks, published, published.map { PreparedNoteReturnInk(it, layoutKey, typefaces) },
            typefaces, kind, images, fixedPages, textCells, selectableBlockIds)
    }

    fun imageTapRegions(leaf: Rect): List<BookImageHit> {
        val layoutKey = key ?: return emptyList()
        return images.map { image ->
            BookImageHit(imageTapBounds(image.bounds, leaf, layoutKey.pageWidthPx, layoutKey.pageHeightPx),
                image, BookImagePreview(bitmap.asImageBitmap(), imagePreviewCrop(image.bounds,
                    layoutKey.pageWidthPx, layoutKey.pageHeightPx, bitmap.width, bitmap.height)))
        }
    }

    fun fixedPageTapRegions(leaf: Rect): List<PdfPageHit> {
        val layoutKey = key ?: return emptyList()
        return fixedPages.map { prepared ->
            PdfPageHit(imageTapBounds(prepared.bounds, leaf, layoutKey.pageWidthPx, layoutKey.pageHeightPx),
                prepared.page, BookImagePreview(bitmap.asImageBitmap(), imagePreviewCrop(prepared.bounds,
                    layoutKey.pageWidthPx, layoutKey.pageHeightPx, bitmap.width, bitmap.height)))
        }
    }

    fun asBookSurface(number: Int) = DemoPageSurface(pageId, number, DemoPageKind.TEXT,
        title = null, body = null, footer = null, imageAlternativeText = null, paginated = this)
}

/** Tiny publication-time overlay sharing the source bitmap; draw/curl never measures text. */
internal class PreparedPageReadingFooter(
    val value: PageReadingFooter,
    key: LayoutKey,
    darkTheme: Boolean,
    typefaces: PlyosTypefaceFamily = PlyosTypefaceFamily.systemSerif,
) {
    val text = value.text(Locale.forLanguageTag(key.localeTag))
    private val density = min(key.density, key.footerHeight / 24f)
    private val dots = value.progressDots(key.contentWidth.toFloat(), density)
    private val bottom = key.pageHeightPx - key.marginY
    private val dotCenterY = bottom - (dots?.radius ?: 0f)
    private val dotLeft = (key.pageWidthPx - (dots?.width ?: 0f)) / 2
    private val numberBottom = dots?.let { dotCenterY - it.radius - 3f * density } ?: bottom
    private val numberHeight = numberBottom - (bottom - key.footerHeight)
    private val numberPaint = textPaint(key, multiplier = 12f / key.fontSizeSp, typefaces = typefaces).apply {
        color = if (darkTheme) 0xFFA2B3C2.toInt() else 0xFF627789.toInt()
        val fontHeight = fontMetrics.descent - fontMetrics.ascent
        // Keep both rows inside the reserved footer even in a short window or with large type.
        if (fontHeight > numberHeight) textSize *= numberHeight / fontHeight
    }
    private val numbers = StaticLayout.Builder.obtain(text, 0, text.length, numberPaint, key.contentWidth)
        .setAlignment(Layout.Alignment.ALIGN_CENTER).setIncludePad(false)
        .setMaxLines(1).setEllipsize(TextUtils.TruncateAt.MIDDLE).build()
    private val numberLeft = (key.pageWidthPx - key.contentWidth) / 2f
    private val numberTop = maxOf(bottom - key.footerHeight, numberBottom - numbers.height)
    private val filledPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = if (darkTheme) 0xFFA1B1BF.toInt() else 0xFF778997.toInt()
    }
    private val remainingPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = if (darkTheme) 0xFF4D5C69.toInt() else 0xFFCBD2D9.toInt()
    }

    fun drawTo(canvas: Canvas, alpha: Int) {
        numberPaint.alpha = alpha
        canvas.withTranslation(numberLeft, numberTop) { numbers.draw(canvas) }
        val row = dots ?: return
        filledPaint.alpha = alpha
        remainingPaint.alpha = alpha
        for (index in 0 until row.count) {
            canvas.drawCircle(dotLeft + row.centerX(index), dotCenterY, row.radius,
                if (index < row.filledCount) filledPaint else remainingPaint)
        }
    }
}

/** Only background rendering calls this object; the page index contains lightweight metrics. */
internal class AndroidPageRasterizer(
    private val document: BookDocument,
    private val key: LayoutKey,
    missingImageLabel: String,
    measurementCacheBytes: Long = MEASUREMENT_CACHE_BYTES,
    private val typefaces: PlyosTypefaceFamily = PlyosTypefaceFamily.systemSerif,
    supportsNativeJustification: (android.text.TextPaint) -> Boolean = ::nativeJustificationAvailable,
) {
    private val sources by lazy { document.readingFlow().associateBy { it.source.id } }
    private val sourceOffsets by lazy { sources.mapValues { it.value.globalOffset } }
    private val measurer = AndroidBookMeasurer(document, missingImageLabel, decodeImages = true,
        typefaces = typefaces, supportsNativeJustification = supportsNativeJustification)
    private val measurements = WeightedLruCache<BlockId, BlockMeasurement>(measurementCacheBytes) {
        when (it) {
            is AndroidImageMeasurement -> (it.bitmap?.allocationByteCount?.toLong() ?: 0L) + 1024
            is AndroidTextMeasurement -> it.layout.text.length * 160L + it.lines.size * 160L +
                (it.dropCap?.bitmapBytes ?: 0L) + it.preparedTextBytes + 1024
            else -> 1024
        }
    }
    // Keep native viewport pixels on ordinary phones/Folds. Cap only extreme dimensions:
    // three single pages or six spread pages always fit within 48 MiB.
    private val maxSurfacePixels = HOT_SURFACES_BYTES / 4 / if (key.pageMode == PageMode.SPREAD) 6 else 3
    private val resolutionScale = min(1.0, sqrt(maxSurfacePixels.toDouble() /
        (key.pageWidthPx.toLong() * key.pageHeightPx)))
    private val width = floor(key.pageWidthPx * resolutionScale).toInt().coerceAtLeast(1)
    private val height = floor(key.pageHeightPx * resolutionScale).toInt().coerceAtLeast(1)
    private val imagePaint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
    var renderCount: Long = 0; private set
    var measureCount: Long = 0; private set

    fun clearMeasurements() = measurements.clear()

    suspend fun render(page: PageLayout): PaginatedPageSurface {
        val context = currentCoroutineContext()
        context.ensureActive()
        val bitmap = createBitmap(width, height, Bitmap.Config.ARGB_8888)
        Trace.beginSection("Listai.pageRaster")
        try {
            val canvas = Canvas(bitmap)
            canvas.scale(width.toFloat() / key.pageWidthPx, height.toFloat() / key.pageHeightPx)
            val noteLinks = mutableListOf<PreparedNoteLink>()
            val images = mutableListOf<PreparedBookImage>()
            val fixedPages = mutableListOf<PreparedPdfPage>()
            val textCells = mutableListOf<PreparedTextCell>()
            for (fragment in page.blocks) {
                context.ensureActive()
                val source = requireNotNull(sources[fragment.blockId])
                val fixedPage = source.source as? BookBlock.FixedPage
                if (fixedPage != null) {
                    rasterizeFixedPage(fixedPage, fragment, bitmap, key)
                    fixedPages += PreparedPdfPage(
                        Rect(fragment.x, fragment.y, fragment.x + fragment.width, fragment.y + fragment.height),
                        fixedPage,
                    )
                    continue
                }
                val measured = measurements[fragment.blockId] ?: measurer.measure(
                    source, key,
                ).also {
                    measureCount++
                    measurements.put(fragment.blockId, it)
                }
                // Refuse mismatched source/layout fragments rather than drawing an incorrect leaf.
                check(measured.lines[fragment.firstLine].start == fragment.startCharOffset)
                check(measured.lines[fragment.endLineExclusive - 1].endExclusive == fragment.endCharOffsetExclusive)
                if (measured is AndroidTextMeasurement) {
                    val glyphs = measured.textGeometry(Locale.forLanguageTag(key.localeTag))
                    val firstGlyph = glyphs.binarySearch { it.span.start.compareTo(fragment.startCharOffset) }.let { if (it < 0) -it - 1 else it }
                    val fragmentBounds = Rect(fragment.x, fragment.y, fragment.x + fragment.width, fragment.y + fragment.height)
                    val textY = measured.textTop - measured.lines[fragment.firstLine].top
                    fun pagePoint(point: androidx.compose.ui.geometry.Offset) = androidx.compose.ui.geometry.Offset(
                        fragment.x + point.x * fragment.scale, fragment.y + (point.y + textY) * fragment.scale)
                    for (glyphIndex in firstGlyph until glyphs.size) {
                        val glyph = glyphs[glyphIndex]
                        val span = glyph.span
                        if (span.end > fragment.endCharOffsetExclusive) break
                        val rect = Rect(pagePoint(glyph.bounds.topLeft), pagePoint(glyph.bounds.bottomRight)).intersect(fragmentBounds)
                        if (rect.width > 0 && rect.height > 0) {
                            val word = span.word
                            fun location(index: Int) = BookLocation(fragment.blockId, index, source.globalOffset + index)
                            textCells += PreparedTextCell(rect, location(span.start), location(span.end),
                                word?.let { location(it.first) }, word?.let { location(it.last + 1) }, span.initialHit, sourceOffsets,
                                pagePoint(glyph.startCaret), pagePoint(glyph.endCaret))
                        }
                    }
                    noteLinks += inlineNoteLinks(fragment, measured.layout,
                        document.noteIndex.referencesIn(fragment.blockId, fragment.startCharOffset,
                            fragment.endCharOffsetExclusive), measured.textTop,
                        glyphs.takeIf { measured.justifiedText != null })
                }
                val sourceImage = source.source as? BookBlock.Image
                if (sourceImage != null && measured is AndroidImageMeasurement && measured.bitmap != null) {
                    images += PreparedBookImage(
                        Rect(fragment.x, fragment.y, fragment.x + fragment.width, fragment.y + fragment.height),
                        sourceImage.imageId, sourceImage.alternativeText,
                    )
                }
                canvas.withTranslation(fragment.x, fragment.y) {
                    // A line's advance width is not its ink bounds: italic and even upright
                    // glyphs can extend into the margin. Keep the vertical page slice, but
                    // let text overhang horizontally within the physical paper bitmap.
                    if (measured is AndroidTextMeasurement) {
                        canvas.clipRect(-fragment.x, 0f, key.pageWidthPx - fragment.x, fragment.height)
                    } else {
                        canvas.clipRect(0f, 0f, fragment.width, fragment.height)
                    }
                    canvas.scale(fragment.scale, fragment.scale)
                    when (measured) {
                        is AndroidTextMeasurement -> {
                            canvas.translate(0f, -measured.lines[fragment.firstLine].top)
                            measured.chapterHeading?.draw(canvas)
                            canvas.translate(0f, measured.textTop)
                            measured.dropCap?.draw(canvas, measured.layout)
                            measured.drawText(canvas)
                            if (fragment.endLineExclusive == measured.lines.size) {
                                canvas.translate(0f, measured.layout.height.toFloat())
                                measured.followingDecoration?.draw(canvas)
                            }
                        }
                        is AndroidImageMeasurement -> {
                            measured.bitmap?.let {
                                canvas.drawBitmap(it, null, RectF(0f, 0f, measured.width, measured.height), imagePaint)
                            } ?: measured.placeholder?.draw(canvas)
                        }
                    }
                }
            }
            val footnotes = rasterizeFootnotes(canvas, page.footnotes, key, measurer)
            noteLinks += footnotes.links
            context.ensureActive()
            bitmap.prepareToDraw()
            renderCount++
            val bodyText = page.blocks.joinToString("\n") { fragment ->
                val source = requireNotNull(sources[fragment.blockId]).source
                if (source is BookBlock.FixedPage) "PDF · ${source.pageIndex + 1}" else
                    source.plainText().substring(fragment.startCharOffset, fragment.endCharOffsetExclusive)
            }
            val text = listOf(bodyText, footnotes.accessibleText).filter(String::isNotEmpty).joinToString("\n")
            return PaginatedPageSurface(page.id, bitmap, text, key.darkTheme, key,
                noteLinks = noteLinks.toList(), typefaces = typefaces, kind = page.kind,
                images = images.toList(), fixedPages = fixedPages.toList(), textCells = textCells.toList(), selectableBlockIds = sources.keys)
        } catch (error: Throwable) {
            // This bitmap has never been published and cannot be referenced by the renderer.
            bitmap.recycle()
            throw error
        } finally {
            Trace.endSection()
        }
    }
}

/** Curl/idle draws prepared source pixels and footer ink. No measurement, decoding or rasterization here. */
internal fun DrawScope.drawPaginatedPage(surface: PaginatedPageSurface, bounds: Rect, alpha: Float) {
    drawIntoCanvas {
        // Align the local texture to physical pixels: a fractional static quad would filter
        // native-resolution text a second time. Curl still applies its continuous outer matrix.
        val left = bounds.left.roundToInt().toFloat()
        val top = bounds.top.roundToInt().toFloat()
        surface.drawTo(it.nativeCanvas,
            RectF(left, top, left + bounds.width.roundToInt(), top + bounds.height.roundToInt()), alpha)
    }
}

#!/usr/bin/env python3
"""Remove PDF double-page visual gutter while keeping the reserved folio footer."""
from pathlib import Path
import sys

root=Path(sys.argv[1])
reader=root/'feature/reader/src/main/kotlin/com/avstaim/listai/feature/reader/bookview'
def patch(file, old, new):
    p=reader/file
    s=p.read_text()
    n=s.count(old)
    if n!=1:
        raise RuntimeError(f'{file}: expected one anchor, found {n}: {old[:100]}')
    p.write_text(s.replace(old,new,1))

# The two leaf rectangles already touch. Suppress the physical spine and
# paper stack/cover underlay when presenting a PDF as two full-bleed pages.
patch('PhysicalBookPainter.kt',
'''    coverSurface: ExternalBookCoverSurface? = null,
) {
    val bindingColor''',
'''    coverSurface: ExternalBookCoverSurface? = null,
    seamlessPdfSpread: Boolean = false,
) {
    val bindingColor''')
patch('PhysicalBookPainter.kt',
'''            logicalProgress = logicalProgress,
            bindingColor = bindingColor,
        )''',
'''            logicalProgress = logicalProgress,
            bindingColor = bindingColor,
            seamlessPdfSpread = seamlessPdfSpread,
        )''')
patch('PhysicalBookPainter.kt',
'''    if (pose == PhysicalBookPose.OPEN && layout.presentation == BookPresentation.SPREAD) {
        drawSpine(layout, logicalProgress)
    }''',
'''    if (pose == PhysicalBookPose.OPEN && shouldDrawBookSpine(layout.presentation, seamlessPdfSpread)) {
        drawSpine(layout, logicalProgress)
    }''')
patch('PhysicalBookPainter.kt',
'''private fun DrawScope.drawOpenBook(
    layout: BookCanvasLayout,
    visibleSurfaces: VisibleBookSurfaces,
    logicalProgress: Float,
    bindingColor: Color?,
) {
    drawBookShadowAndCover(
        layout = layout,
        hasLeftSurface = visibleSurfaces.left != null,
        hasRightSurface = visibleSurfaces.right != null,
        bindingColor = bindingColor,
    )
    drawPageStacks(
        layout = layout,
        logicalProgress = logicalProgress,
        visibleSurfaces = visibleSurfaces,
    )''',
'''private fun DrawScope.drawOpenBook(
    layout: BookCanvasLayout,
    visibleSurfaces: VisibleBookSurfaces,
    logicalProgress: Float,
    bindingColor: Color?,
    seamlessPdfSpread: Boolean = false,
) {
    if (!seamlessPdfSpread) {
        drawBookShadowAndCover(
            layout = layout,
            hasLeftSurface = visibleSurfaces.left != null,
            hasRightSurface = visibleSurfaces.right != null,
            bindingColor = bindingColor,
        )
        drawPageStacks(
            layout = layout,
            logicalProgress = logicalProgress,
            visibleSurfaces = visibleSurfaces,
        )
    }''')
p=reader/'PhysicalBookPainter.kt'
s=p.read_text()
needle='''internal fun DrawScope.drawPhysicalBook('''
if s.count(needle)!=1: raise RuntimeError('Could not locate physical draw function')
s=s.replace(needle,'''internal fun shouldDrawBookSpine(presentation: BookPresentation, seamlessPdfSpread: Boolean): Boolean =
    presentation == BookPresentation.SPREAD && !seamlessPdfSpread

'''+needle,1)
p.write_text(s)

# Only PDFs in landscape two-page mode. Real occluding hinges keep their mask.
patch('PhysicalBookView.kt',
'''                        curl = entryFrame ?: resolvedTurn?.frame,
                        coverSurface = coverSurface,
                    )''',
'''                        curl = entryFrame ?: resolvedTurn?.frame,
                        coverSurface = coverSurface,
                        seamlessPdfSpread = fixedPdfDocument &&
                            presentation == BookPresentation.SPREAD &&
                            displayFeature?.avoidsContent != true,
                    )''')

# Suppress the horizontal gradient and rim that visually separate PDF leaves.
patch('DemoPageSurface.kt',
'''            drawWhitePaper(bounds, side, paperColor)
        }
        drawPreparedContent(surface, bounds, contentAlpha)''',
'''            if (pdf?.fixedPages?.isNotEmpty() == true) {
                drawRect(color = paperColor, topLeft = bounds.topLeft, size = bounds.size)
            } else {
                drawWhitePaper(bounds, side, paperColor)
            }
        }
        drawPreparedContent(surface, bounds, contentAlpha)''')

# The existing pagination footer reserves 24dp below the PDF (not in its bitmap).
models=root/'reader/pagination/src/main/kotlin/com/avstaim/listai/reader/pagination/PaginationModels.kt'
m=models.read_text()
footer='''    val footerHeight: Float get() = (24f * density).coerceAtMost(pageHeightPx * .12f)'''
if m.count(footer)!=1: raise RuntimeError('Folio footer missing or altered')
if m.count('''    val pdfFullBleed: Boolean = false,''')!=1:
    raise RuntimeError('PDF full-bleed mode missing')
if m.count('''    val contentHeight: Float get() = (pageHeightPx - contentTop - marginY - footerHeight - bottomContentInset).coerceAtLeast(1f)''')!=1:
    raise RuntimeError('PDF raster may cover footer')

# Unit tests for both PDF seam and lower folio.
tests=root/'feature/reader/src/test/kotlin/com/avstaim/listai/feature/reader/bookview/BookViewLayoutTest.kt'
s=tests.read_text()
marker='''class BookViewLayoutTest {'''
if s.count(marker)!=1: raise RuntimeError('Cannot locate layout tests')
s=s.replace(marker,'''class BookViewLayoutTest {
    @Test fun pdfLandscapeSpreadHasNoSpine() {
        assertEquals(false, shouldDrawBookSpine(BookPresentation.SPREAD, true))
        assertEquals(true, shouldDrawBookSpine(BookPresentation.SPREAD, false))
        assertEquals(false, shouldDrawBookSpine(BookPresentation.SINGLE, false))
    }

    @Test fun pdfKeepsBottomFolioBelowRaster() {
        val key = com.avstaim.listai.reader.pagination.LayoutKey(
            viewportWidthPx = 1600,
            viewportHeightPx = 900,
            pageMode = com.avstaim.listai.reader.pagination.PageMode.SPREAD,
            pageWidthPx = 800,
            pageHeightPx = 900,
            pdfFullBleed = true,
            horizontalMarginsDp = 0f,
            verticalMarginsDp = 0f,
            density = 2f,
        )
        assertEquals(0f, key.marginX, TOLERANCE)
        assertEquals(0f, key.marginY, TOLERANCE)
        assertEquals(48f, key.footerHeight, TOLERANCE)
        assertEquals(852f, key.contentHeight, TOLERANCE)
    }
''',1)
tests.write_text(s)
print('Seamless PDF spread with retained numbered folios and unit tests applied.')

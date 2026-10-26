"""Ensure every locally selectable case has a meaningful TFT description."""

import re
import unittest
from pathlib import Path


SOURCE = (Path(__file__).resolve().parents[1] / "aed-trainer" /
          "display-adapter.cpp")


class LocalCaseLabelTests(unittest.TestCase):
    def test_all_cases_have_distinct_meaningful_labels(self):
        text = SOURCE.read_text(encoding="utf-8")
        labels = re.findall(
            r'\{\s*"(A[1-8])"\s*,\s*"([^"]+)"\s*,\s*"([^"]*)"\s*\}',
            text,
        )
        self.assertEqual(len(labels), 8)
        self.assertEqual({code for code, _, _ in labels},
                         {f"A{i}" for i in range(1, 9)})
        all_text = [first + " " + second for _, first, second in labels]
        self.assertEqual(len(set(all_text)), 8)
        self.assertTrue(all(len(label.strip()) >= 12 for label in all_text))
        # Built-in 5x7 font: one line of text at size 1 fits 160px.
        self.assertTrue(all(len(line) <= 26
                            for _, first, second in labels
                            for line in (first, second)))
        self.assertIn('textCentered(caseTitle', text)


if __name__ == "__main__":
    unittest.main()

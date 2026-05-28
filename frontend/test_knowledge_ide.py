import os
import re
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


ROOT = Path(__file__).resolve().parent
SCREENSHOT_DIR = ROOT / "test-artifacts"
SCREENSHOT_DIR.mkdir(exist_ok=True)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://127.0.0.1:5173")


def expect_any_visible(locators, description):
    errors = []
    for locator in locators:
        try:
            expect(locator.first).to_be_visible(timeout=1500)
            return
        except Exception as exc:
            errors.append(str(exc).splitlines()[0])

    raise AssertionError(f"Could not find visible {description}. Tried {len(locators)} locators: {errors}")


def check_viewport(page, width, height, name):
    page.set_viewport_size({"width": width, "height": height})
    response = page.goto(FRONTEND_URL)
    assert response is not None and response.ok, f"Frontend did not load from {FRONTEND_URL}"
    page.wait_for_load_state("networkidle")

    if width >= 768:
        expect_any_visible(
            [
                page.get_by_label("Primary navigation"),
                page.locator(".activity-rail"),
                page.locator(".ide-rail"),
            ],
            "primary navigation",
        )
        expect_any_visible(
            [
                page.get_by_label("Workspace explorer"),
                page.locator(".explorer"),
                page.locator(".ide-explorer"),
            ],
            "workspace explorer",
        )
    expect_any_visible(
        [
            page.get_by_role("heading", name="Requirement.docx"),
            page.get_by_text("Requirement.docx"),
        ],
        "active document title",
    )
    if width >= 1180:
        expect_any_visible(
            [
                page.get_by_text(re.compile(r"AI analyst|AI Inspector", re.I)),
                page.locator(".ai-inspector"),
                page.locator(".ide-inspector"),
            ],
            "AI inspector panel",
        )
    expect_any_visible(
        [
            page.get_by_text("Gap detected"),
            page.get_by_text("AI Summary"),
            page.get_by_text("Key Findings"),
        ],
        "document insight content",
    )
    expect_any_visible(
        [
            page.get_by_role("button", name=re.compile(r"Open command palette|Search or jump to", re.I)),
            page.locator(".command-palette"),
        ],
        "command palette button",
    )

    overflow = page.evaluate(
        "() => document.documentElement.scrollWidth > document.documentElement.clientWidth"
    )
    assert not overflow, f"Horizontal overflow detected at {width}x{height}"

    page.screenshot(path=str(SCREENSHOT_DIR / f"{name}.png"), full_page=True)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    check_viewport(page, 1440, 1000, "knowledge-ide-desktop")
    check_viewport(page, 390, 920, "knowledge-ide-mobile")
    browser.close()

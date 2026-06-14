from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        args=[
            "--use-gl=angle",
            "--use-angle=swiftshader",
            "--enable-unsafe-swiftshader",
            "--ignore-gpu-blocklist",
        ],
    )
    page = browser.new_page(
        viewport={"width": 1440, "height": 900}, device_scale_factor=2
    )
    page.goto("http://localhost:5173/moodboard")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2500)
    # full board (to check folders clear the header now)
    page.screenshot(path="C:/Users/miche/Asterism/.superpowers/mb_full.png")
    # zoom into the photo cluster to judge sharpness
    page.screenshot(
        path="C:/Users/miche/Asterism/.superpowers/mb_zoom.png",
        clip={"x": 430, "y": 250, "width": 460, "height": 360},
    )
    browser.close()
    print("done")

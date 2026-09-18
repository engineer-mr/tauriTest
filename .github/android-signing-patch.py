#!/usr/bin/env python3
"""Inject Android release signing config into the generated build.gradle.kts.

Run from the repository root AFTER `tauri android init`.
Tauri v2's generated template has no signing logic: without this patch the
release APK is produced unsigned and cannot be installed on Android devices.
"""
import re
import sys

path = "src-tauri/gen/android/app/build.gradle.kts"
with open(path, encoding="utf-8") as f:
    content = f.read()

signing_block = """    signingConfigs {
        create("release") {
            val keystorePropertiesFile = rootProject.file("keystore.properties")
            val keystoreProperties = Properties()
            if (keystorePropertiesFile.exists()) {
                keystoreProperties.load(FileInputStream(keystorePropertiesFile))
            }
            keyAlias = keystoreProperties["keyAlias"] as String
            keyPassword = keystoreProperties["password"] as String
            storeFile = file(keystoreProperties["storeFile"] as String)
            storePassword = keystoreProperties["password"] as String
        }
    }
"""

# 1. ensure needed imports
if "import java.io.FileInputStream" not in content:
    content, n = re.subn(
        r"(import java\.util\.Properties)",
        "import java.io.FileInputStream\n\\1",
        content,
        count=1,
    )
    if n == 0:
        sys.exit("ERROR: expected `import java.util.Properties` not found")

# 2. insert signingConfigs right after the `android {` opening line
if "signingConfigs" not in content:
    android_open = re.search(r"android\s*\{", content)
    if android_open is None:
        sys.exit("ERROR: `android {` block not found")
    insert_at = android_open.end()
    content = content[:insert_at] + "\n" + signing_block + content[insert_at:]

# 3. wire the release build type to the release signing config
if "signingConfigs.getByName(\"release\")" not in content:
    content, n = re.subn(
        r"(getByName\(\"release\"\)\s*\{)",
        "\\1\n            signingConfig = signingConfigs.getByName(\"release\")",
        content,
        count=1,
    )
    if n == 0:
        sys.exit("ERROR: `getByName(\"release\")` block not found")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("build.gradle.kts signing config injected OK")

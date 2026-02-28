import urllib.request
import sys
import time

def check_url(url, name):
    print(f"Checking {name} ({url})...", end=" ")
    try:
        with urllib.request.urlopen(url) as response:
            if response.getcode() == 200:
                print("OK")
                return True
            else:
                print(f"FAILED (Status: {response.getcode()})")
                return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def main():
    base_url = "http://localhost:3000"
    
    print("=== Integration Test Suite ===")
    print("Waiting for server to be ready...")
    
    # Retry loop for server start
    max_retries = 5
    for i in range(max_retries):
        if check_url(base_url, "Home Page"):
            break
        print(f"Retrying in 2s ({i+1}/{max_retries})...")
        time.sleep(2)
    else:
        print("CRITICAL: Server is not reachable. Is 'npm run dev' running?")
        sys.exit(1)

    tests = [
        ("/editor", "Dual Mode Editor"),
        ("/test", "Unit Test Dashboard"),
    ]

    failed = 0
    for path, name in tests:
        if not check_url(base_url + path, name):
            failed += 1

    print("-" * 30)
    if failed == 0:
        print("SUCCESS: All integration checks passed.")
        sys.exit(0)
    else:
        print(f"FAILURE: {failed} checks failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()

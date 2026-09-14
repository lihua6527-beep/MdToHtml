import unittest
import os
import shutil
import subprocess
import time
import requests
import sys

# Add root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from verify_deployment import start_server, check_server_health

class TestIntegration(unittest.TestCase):
    
    def setUp(self):
        # Ensure we are in a clean state before running
        self.root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
        
    def test_workflow(self):
        """
        Simulates the migration and startup flow.
        Note: We assume migration is ALREADY done by the main task execution, 
        so this tests the 'After State' validity and server startup.
        """
        # 1. Verify Directory Structure
        readme_path = os.path.join(self.root_dir, "README.md")
        sub_readme_path = os.path.join(self.root_dir, "MdToHtml", "README.md")
        
        self.assertTrue(os.path.exists(readme_path), "Root README should exist")
        self.assertFalse(os.path.exists(sub_readme_path), "Subfolder README should be gone")
        
        # 2. Start Server (Mocking or Real?)
        # Since this is a "real" integration test, we try to start the actual server 
        # but for a short time to verify it works.
        
        print("Starting integration test server...")
        process = start_server()
        self.assertIsNotNone(process, "Server process should start")
        
        try:
            # 3. Check Health (waits up to 60s)
            is_healthy = check_server_health(process)
            self.assertTrue(is_healthy, "Server should become healthy")
            
            # 4. Simple Access Check
            try:
                resp = requests.get("http://localhost:3000")
                self.assertEqual(resp.status_code, 200)
            except Exception as e:
                self.fail(f"Request failed: {e}")
                
        finally:
            # Cleanup
            print("Stopping integration test server...")
            subprocess.call(['taskkill', '/F', '/T', '/PID', str(process.pid)])

if __name__ == '__main__':
    unittest.main()

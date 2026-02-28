import os
import unittest
from unittest.mock import patch, mock_open, MagicMock
import sys

# Add root to sys.path to import migrate_readme
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from migrate_readme import migrate_readme

class TestMigration(unittest.TestCase):
    
    @patch('os.path.exists')
    @patch('builtins.open', new_callable=mock_open, read_data="Test content (docs/foo.md)")
    @patch('os.remove')
    def test_migrate_success(self, mock_remove, mock_file, mock_exists):
        # Setup: Source exists
        mock_exists.side_effect = lambda x: "MdToHtml" in x
        
        result = migrate_readme(".")
        
        self.assertTrue(result)
        # Check if file was read
        mock_file.assert_any_call(os.path.join(".", "MdToHtml", "README.md"), 'r', encoding='utf-8')
        # Check if file was written with replaced path
        mock_file.assert_any_call(os.path.join(".", "README.md"), 'w', encoding='utf-8')
        
        # Verify content replacement logic
        handle = mock_file()
        handle.write.assert_called_with("Test content (MdToHtml/docs/foo.md)")
        
        # Check if source was removed
        mock_remove.assert_called_once()

    @patch('os.path.exists')
    def test_migrate_no_source(self, mock_exists):
        mock_exists.return_value = False
        result = migrate_readme(".")
        self.assertFalse(result)

    @patch('os.path.exists')
    @patch('builtins.open', side_effect=PermissionError)
    def test_migrate_read_error(self, mock_file, mock_exists):
        mock_exists.return_value = True
        result = migrate_readme(".")
        self.assertFalse(result)

    @patch('os.path.exists')
    @patch('builtins.open')
    def test_migrate_write_error(self, mock_file, mock_exists):
        mock_exists.return_value = True
        
        # Create a handle for reading
        read_handle = MagicMock()
        read_handle.read.return_value = "Test content"
        read_handle.__enter__.return_value = read_handle
        read_handle.__exit__.return_value = None
        
        # Set side_effect: first call returns read_handle, second raises Exception
        mock_file.side_effect = [read_handle, PermissionError("Write failed")]
        
        result = migrate_readme(".")
        self.assertFalse(result)

    @patch('os.path.exists')
    @patch('builtins.open', new_callable=mock_open, read_data="Test content")
    @patch('os.remove')
    def test_migrate_delete_error(self, mock_remove, mock_file, mock_exists):
        mock_exists.return_value = True
        mock_remove.side_effect = PermissionError("Delete failed")
        
        result = migrate_readme(".")
        # Should return True because delete failure is logged but not fatal
        self.assertTrue(result)

if __name__ == '__main__':
    unittest.main()

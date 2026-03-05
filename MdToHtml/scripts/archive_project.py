import os
import zipfile
import datetime

def zip_project(output_filename):
    # Get current directory
    root_dir = os.getcwd()
    
    # Define exclusion patterns (folders)
    exclude_dirs = {
        'node_modules', '.next', '.git', '.vs', '.idea', 'dist', 'build', '__pycache__', 'tmp'
    }
    
    # Define exclusion extensions/files
    exclude_files = {
        '.DS_Store', 'Thumbs.db', output_filename
    }

    print(f"Archiving project to {output_filename}...")
    
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(root_dir):
            # Modify dirs in-place to skip excluded directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                if file in exclude_files or file.endswith('.zip') or file.endswith('.rar'):
                    continue
                    
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, root_dir)
                
                # Double check path components for excluded dirs (in case of nested matches not caught by os.walk modification)
                # (os.walk modification handles immediate children, but this is safer)
                if any(part in exclude_dirs for part in arcname.split(os.sep)):
                    continue

                try:
                    zipf.write(file_path, arcname)
                    # print(f"Added: {arcname}")
                except Exception as e:
                    print(f"Error adding {arcname}: {e}")

    print(f"Archive created successfully: {output_filename}")

if __name__ == "__main__":
    today = datetime.date.today().strftime("%Y%m%d")
    output_zip = f"MdToHtml_Backup_{today}.zip"
    zip_project(output_zip)

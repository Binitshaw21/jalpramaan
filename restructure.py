import os
import shutil

# Move requirements.txt to root
if os.path.exists("api/requirements.txt"):
    shutil.copy("api/requirements.txt", "requirements.txt")

# Remove api folder
if os.path.exists("api"):
    shutil.rmtree("api")

print("Project restructured for Vercel root deployment.")

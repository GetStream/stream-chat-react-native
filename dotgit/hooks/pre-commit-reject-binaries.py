#!/usr/bin/env python
import os
import subprocess
import sys

# from https://gist.github.com/LukasKnuth/1839424
"""
This is a git commit-hook which can be used to check if huge files
 where accidentally added to the staging area and are about to be
 committed.
If there is a file which is bigger then the given "max_file_size"-
 variable, the script will exit non-zero and abort the commit.
This script is meant to be added as a "pre-commit"-hook. See this
 page for further information:
    http://progit.org/book/ch7-3.html#installing_a_hook
In order to make the script work probably, you'll need to set the
 above path to the python interpreter (first line of the file)
 according to your system (under *NIX do "which python" to find out).
Also, the "git_binary_path"-variable should contain the absolute
 path to your "git"-executable (you can use "which" here, too).
See the included README-file for further information.
The script was developed and has been confirmed to work under
 python 3.2.2 and git 1.7.7.1 (might also work with earlier versions!)
"""

# The maximum file-size for a file to be committed:
max_file_size = 64 * 1024  # in KB (= 1024 byte)
# The path to the git-binary:
git_binary_path = "/usr/bin/git"


def sizeof_fmt(num):
    for x in ["bytes", "KB", "MB", "GB", "TB"]:
        if num < 1024.0:
            return "%3.1f %s" % (num, x)
        num /= 1024.0


# Now, do the checking:
try:
    print("Checking for files bigger then " + sizeof_fmt(max_file_size * 1024))
    # Check all files in the staging-area:
    text = subprocess.check_output(
        [git_binary_path, "status", "--porcelain", "-uno"], stderr=subprocess.STDOUT
    ).decode("utf-8")
    file_list = text.splitlines()

    # Check all files:
    for file_s in file_list:
        if os.path.isfile(file_s[3:]):
            stat = os.stat(file_s[3:])
            if stat.st_size > (max_file_size * 1024):
                # File is to big, abort the commit:
                print(
                    "'" + file_s[3:] + "' is too huge to be commited!",
                    "(" + sizeof_fmt(stat.st_size) + ")",
                )
                sys.exit(1)

    # Everything seams to be okay:
    print("No huge files found.")
    sys.exit(0)
except Exception:
    # There was a problem
    e = sys.exc_info()[1]
    print(e.args)
    print("Oops...")
    sys.exit(12)

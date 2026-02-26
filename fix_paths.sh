#!/bin/bash

# Move any file or directory containing backslashes into the proper path structure
find . -depth -name '*\\*' | while IFS= read -r path; do
  # compute new path by replacing backslashes with slashes
  new=$(echo "$path" | sed 's/\\/\//g')
  echo "Moving: '$path' -> '$new'"
  mkdir -p "$(dirname "$new")"
  mv -v "$path" "$new"
done

echo "path fix completed"

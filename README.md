JS script to backup all your reMarkable files, original and annoted ones.

# Export all documents present on your reMarkable

After following the steps below you should have:
- In `/raw` are the documents as they are stored in the reMarkable. It can be useful right away if you want to access original .pdfs and .epubs before they were written on.
Also, it contains .metadata files with useful information (used in the script) and .rm files that is a proprietary file extension used internally.
- In `/documents` are the documents with the user writtings and annotations. Each one of these documents had been exported using doc.js and being connected via USB to a reMarkable.

## 1. Get all the raw content (without annotations)

First get all the content from your rM. You can connect via ssh once you connect via usb. Go in Settings>Storage and activate the web interface.

`scp -rp root@10.11.99.1:/home/root/.local/share/remarkable/xochitl/ ./raw/`

the password can be found in General > Help: About > Copyright and licences

## 2. Export the docs

With nodejs 18 (! not working with an above version, because of inconsistent response headers sent by the rM webserver):

`nodejs export-docs.js`

It takes time (~30 seconds by document).
Wait until every document is exported. Folders hierarchy is kept.
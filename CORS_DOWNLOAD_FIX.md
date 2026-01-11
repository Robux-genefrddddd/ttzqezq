# CORS Download Error Fix

## Problem
When downloading files from the asset pages, you get this error:
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' from origin 'https://97317377ff054164a28036d64c06f1f4-vibe-haven.builderio.xyz' has been blocked by CORS policy
```

**Why?** Your app is hosted on a different domain (Builder.io), but Firebase Storage doesn't allow cross-origin requests by default.

---

## Solution ✅

### What Changed

**Problem**: Client directly fetches from Firebase Storage (CORS blocked)
```
Browser → Firebase Storage (BLOCKED ❌)
```

**Solution**: Client requests from backend, backend proxies to Firebase
```
Browser → Your Backend → Firebase Storage (ALLOWED ✅)
```

### Files Updated

1. **`server/index.ts`**
   - Added `/api/download` endpoint

2. **`server/routes/download.ts`** (NEW)
   - Backend proxy that handles Firebase Storage requests
   - Includes security validation and error handling

3. **`client/lib/fileService.ts`**
   - `downloadAssetFile()` now uses `/api/download` instead of direct Firebase requests
   - Better error handling

4. **`cors.json`** (NEW)
   - CORS configuration (optional - for direct Firebase access fallback)

---

## Deployment

### For Development
No changes needed! Just rebuild:
```bash
npm run build
npm run dev
```

The backend automatically handles downloads via the new `/api/download` endpoint.

### For Production
The backend proxy is already configured and will work out of the box.

---

## How It Works

### Download Flow

1. **User clicks Download** in the asset page
2. **FilePreviewModal** calls `downloadAssetFile()`
3. **Frontend makes request to backend**: `GET /api/download?filePath=assets/...&fileName=...`
4. **Backend receives request**:
   - Validates the file path (security)
   - Fetches file from Firebase Storage
   - Returns file to browser
5. **Browser downloads file** (no CORS issues!)

### Example Request
```
GET /api/download?filePath=assets%2FZb5iMlb3gDdWOywYxUOi%2FCameraSystem.rbxm&fileName=CameraSystem.rbxm
```

### Backend Response
```
HTTP/1.1 200 OK
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="CameraSystem.rbxm"
Content-Length: 32768
Accept-Ranges: bytes

[binary file content]
```

---

## Security

The download endpoint includes security checks:

✅ **Path Validation**
- Blocks `..` (directory traversal)
- Blocks paths starting with `/`

✅ **Error Handling**
- Returns 404 if file not found
- Returns 403 if access denied
- Returns 500 for other errors

✅ **No Authentication Required**
- Files are public (readable by everyone)
- Upload/delete still requires authentication via Firebase Rules

---

## Testing

After deployment:

1. Go to your app at https://97317377ff054164a28036d64c06f1f4-vibe-haven.builderio.xyz
2. Navigate to an asset
3. Click **Download**
4. Files should download **without CORS errors** ✅

### Debugging
If you still get errors:

1. Open Browser DevTools (F12)
2. Go to **Network** tab
3. Try downloading a file
4. Check the `/api/download` request:
   - Should see **200 OK** response
   - File should be in **Response** tab

---

## Alternative: Direct CORS Configuration

If you prefer to configure CORS directly on Firebase Storage (instead of using the backend proxy):

### Step 1: Install Google Cloud SDK
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

### Step 2: Configure CORS
```bash
gsutil cors set cors.json gs://keysystem-d0b86-8df89.firebasestorage.app
```

### Step 3: Verify
```bash
gsutil cors get gs://keysystem-d0b86-8df89.firebasestorage.app
```

**Note**: This requires the `cors.json` file which is included in the project.

---

## Comparison: Proxy vs Direct CORS

| Feature | Proxy (✅ Used) | Direct CORS |
|---------|-----------|-----------|
| Easiest to set up | ✅ Works out of box | Need `gsutil` + CLI |
| Bypass cross-origin | ✅ Yes | No - still CORS |
| Add logging/tracking | ✅ Easy | Hard |
| Access control | ✅ Server-side | Limited |
| Rate limiting | ✅ Can add | Hard |

**Why proxy is better**: It gives you full control over downloads and makes it easier to add features like logging, access control, and rate limiting.

---

## Files Reference

| File | Purpose |
|------|---------|
| `server/routes/download.ts` | Download proxy endpoint |
| `server/index.ts` | Routes registration |
| `client/lib/fileService.ts` | Download function (updated) |
| `cors.json` | CORS config (optional fallback) |

---

## Questions?

- **Does this affect uploads?** No, uploads still work as before
- **Do users need to authenticate?** No, files are public downloads
- **Is there a file size limit?** No, Node.js can stream large files
- **Does this cost extra?** No, just uses existing bandwidth

Enjoy your fixed downloads! 🚀

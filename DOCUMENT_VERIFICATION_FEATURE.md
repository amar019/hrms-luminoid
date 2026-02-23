# Document Verification Feature

## Overview
Added document verification status tracking for employee documents with expiry date management.

## Backend Changes

### 1. File Model (`backend/models/File.js`)
Added new fields:
```javascript
verificationStatus: { 
  type: String, 
  enum: ['UNVERIFIED', 'VERIFIED', 'EXPIRED', 'INVALID'], 
  default: 'UNVERIFIED' 
},
verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
verifiedAt: Date,
expiryDate: Date,
verificationNotes: String
```

### 2. Controller (`backend/controllers/fileController.js`)
- Added `verifyDocument()` function
- Updated `getFiles()` to populate `verifiedBy`
- Updated `uploadFile()` to accept `expiryDate`

### 3. Routes (`backend/routes/files.js`)
- Added: `PUT /api/files/:fileId/verify` (HR/Admin only)

## API Usage

### Verify Document
```javascript
PUT /api/files/:fileId/verify
Headers: Authorization: Bearer <token>
Body: {
  "verificationStatus": "VERIFIED", // or "UNVERIFIED", "EXPIRED", "INVALID"
  "expiryDate": "2025-12-31", // optional
  "verificationNotes": "Document verified successfully" // optional
}
```

## Verification Status

| Status | Description | Use Case |
|--------|-------------|----------|
| UNVERIFIED | Default status | Document uploaded but not reviewed |
| VERIFIED | Document is valid | HR approved the document |
| EXPIRED | Document has expired | Certificate/license expired |
| INVALID | Document is invalid | Fake or incorrect document |

## Frontend Implementation Needed

### 1. Add Verification Badge in Table
Show verification status badge next to document name:
- UNVERIFIED: Gray badge
- VERIFIED: Green badge with checkmark
- EXPIRED: Orange badge with warning
- INVALID: Red badge with X

### 2. Add Verify Button (HR/Admin only)
In actions column, add "Verify" button that opens modal with:
- Verification status dropdown
- Expiry date picker (optional)
- Verification notes textarea
- Submit button

### 3. Add Expiry Date Field in Upload Modal
For HR/Admin when uploading employee documents:
- Add optional "Expiry Date" field
- Show for documents like certificates, licenses

### 4. Show Verification Details
Display in document row or tooltip:
- Verified by: [Name]
- Verified at: [Date]
- Expiry date: [Date]
- Notes: [Text]

### 5. Filter by Verification Status
Add filter dropdown to show:
- All documents
- Unverified only
- Verified only
- Expired only
- Invalid only

## Example Frontend Code

### Verification Badge Component
```jsx
const getVerificationBadge = (status) => {
  const badges = {
    UNVERIFIED: <Badge bg="secondary">Unverified</Badge>,
    VERIFIED: <Badge bg="success"><i className="fas fa-check me-1"></i>Verified</Badge>,
    EXPIRED: <Badge bg="warning"><i className="fas fa-exclamation me-1"></i>Expired</Badge>,
    INVALID: <Badge bg="danger"><i className="fas fa-times me-1"></i>Invalid</Badge>
  };
  return badges[status] || badges.UNVERIFIED;
};
```

### Verify Document Function
```jsx
const handleVerifyDocument = async (fileId, data) => {
  try {
    await api.put(`/api/files/${fileId}/verify`, data);
    fetchFiles();
    toast.success('Document verified successfully');
  } catch (error) {
    toast.error('Error verifying document');
  }
};
```

## Benefits

1. **Document Authenticity**: Track which documents are verified by HR
2. **Expiry Management**: Automatically identify expired documents
3. **Compliance**: Maintain audit trail of document verification
4. **Invalid Detection**: Mark fake or incorrect documents
5. **Reporting**: Generate reports on document verification status

## Next Steps

1. Implement frontend UI for verification
2. Add automated expiry notifications (cron job)
3. Add verification history tracking
4. Create verification reports for HR
5. Add bulk verification feature


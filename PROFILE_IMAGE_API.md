# Profile Image API Documentation

## Overview
The LMS now supports employee profile image upload and management using AWS S3 storage. Images are automatically deleted when employees are removed from the system.

## New API Endpoints

### Upload Profile Image
**POST** `/api/employee-profiles/me/profile-image`

Upload a profile image for the authenticated user.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Body:**
- `profileImage`: Image file (max 5MB, image formats only)

**Response:**
```json
{
  "message": "Profile image uploaded successfully",
  "profileImage": "https://your-bucket.s3.amazonaws.com/profile-images/userId-timestamp.jpg"
}
```

### Delete Profile Image
**DELETE** `/api/employee-profiles/me/profile-image`

Delete the profile image for the authenticated user.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Profile image deleted successfully"
}
```

## Configuration

### Environment Variables
Add these to your `.env` file:

```env
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-lms-bucket-name
```

### AWS S3 Setup
1. Create an S3 bucket
2. Configure bucket permissions for public read access on uploaded images
3. Create IAM user with S3 permissions
4. Update environment variables with credentials

## Features

### Automatic Cleanup
- Profile images are automatically deleted from S3 when:
  - User uploads a new profile image (old one is deleted)
  - Employee is deleted from the system
  - User manually deletes their profile image

### File Validation
- Maximum file size: 5MB
- Allowed formats: All image types (jpg, png, gif, etc.)
- Files are stored with unique names to prevent conflicts

### Security
- Only authenticated users can upload/delete their own images
- Images are stored with public read access for display
- File validation prevents non-image uploads

## Frontend Integration

The profile image functionality is integrated into the Employee Profile page with:
- Image preview with circular crop
- Upload button with camera icon
- Delete button for removing images
- Loading states during upload
- Error handling and user feedback

## Usage Example

```javascript
// Upload image
const formData = new FormData();
formData.append('profileImage', file);

const response = await api.post('/api/employee-profiles/me/profile-image', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

// Delete image
await api.delete('/api/employee-profiles/me/profile-image');
```
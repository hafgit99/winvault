# WinVault File Attachment Download Fix - TODO List

## Issue Analysis
The file attachment download feature is not working properly in the WinVault password manager. The issue appears to be in the Electron IPC save-file handler (main.js:245-266), though the client-side code has both IPC and fallback methods.

## Problems Identified

### 1. Main.js save-file handler issues (lines 245-266):
- **Base64 decoding**: The handler splits on comma but doesn't validate if it's a valid data URL format
- **Error handling**: Limited error information provided to client
- **File path validation**: No validation of the resulting file path
- **Buffer creation**: Uses Buffer.from() directly without error checking

### 2. Client-side fallback issues:
- **Error propagation**: Fallback method doesn't return success/failure status
- **Memory usage**: Creates byte array manually instead of using modern APIs
- **Cleanup**: URL cleanup might be too aggressive (100ms timeout)

### 3. Potential integration issues:
- **IPC parameter mismatch**: preload.js sends (name, data) but main expects { name, data }
- **Data format**: Attachment data might include data URL prefixes that aren't handled consistently

## TODO List

### Phase 1: Fix the Main.js save-file Handler

#### 1.1 Improve Base64 Data Processing
- [ ] Add robust data URL parsing to handle different formats:
  - `data:mimeType;base64,data`
  - `data:MIME-TYPE;base64,DATA`
  - Plain base64 strings
- [ ] Validate base64 string before decoding
- [ ] Add proper error messages for invalid base64 data

#### 1.2 Enhance Error Handling
- [ ] Add try-catch around base64 decoding
- [ ] Provide detailed error information back to client
- [ ] Log specific error types for debugging
- [ ] Validate file path before writing

#### 1.3 Fix Parameter Handling
- [ ] Ensure parameter destructuring works correctly
- [ ] Add validation for required parameters (name, data)
- [ ] Handle null/undefined data gracefully

### Phase 2: Improve Client-side Download Logic

#### 2.1 Enhance Fallback Method
- [ ] Update fallback method to use modern Blob API
- [ ] Return proper success/failure status
- [ ] Increase URL cleanup timeout (100ms → 1000ms)
- [ ] Add error handling for different file types

#### 2.2 Improve IPC Integration
- [ ] Add retry logic for IPC calls
- [ ] Better error message display to users
- [ ] Add loading states during download
- [ ] Log detailed debugging information

### Phase 3: Add Robustness and Testing

#### 3.1 Data Format Standardization
- [ ] Ensure all attachment data is stored consistently
- [ ] Add validation when attachments are uploaded
- [ ] Standardize MIME type handling
- [ ] Add file size validation

#### 3.2 Comprehensive Testing
- [ ] Test with different image formats (PNG, JPG, GIF, WebP)
- [ ] Test with different document formats (PDF, DOC, TXT, etc.)
- [ ] Test with binary files (ZIP, EXE, etc.)
- [ ] Test edge cases:
  - Empty files
  - Very large files
  - Corrupted base64 data
  - Files with special characters in names
  - Files without MIME types

#### 3.3 Performance Optimization
- [ ] Optimize base64 decoding for large files
- [ ] Add progress indicators for large downloads
- [ ] Consider streaming for very large files

### Phase 4: User Experience and Feedback

#### 4.1 Add User Feedback
- [ ] Show download progress
- [ ] Display success/error messages
- [ ] Add retry functionality
- [ ] Show file size and format information

#### 4.2 Safety Improvements
- [ ] Add file type validation for security
- [ ] Implement size limits for downloads
- [ ] Add virus scan warnings for executables
- [ ] Verify file integrity after download

### Phase 5: Regression Testing

#### 5.1 Existing Functionality Tests
- [ ] Verify vault opening/closing still works
- [ ] Test all other IPC handlers still function
- [ ] Verify credential editing works
- [ ] Test backup/restore functionality

#### 5.2 Cross-platform Testing
- [ ] Test on Windows (primary target)
- [ ] Test on macOS (if supported)
- [ ] Test on Linux (if supported)
- [ ] Test with different Electron versions

## Implementation Priority

### High Priority (Critical for basic functionality)
1. Fix main.js save-file handler base64 decoding
2. Fix parameter handling between preload.js and main.js
3. Improve error handling and user feedback
4. Test basic image and document downloads

### Medium Priority (Important for robustness)
5. Enhance client-side fallback method
6. Add comprehensive testing for different file types
7. Add data format standardization
8. Improve performance for large files

### Low Priority (Nice to have features)
9. Add progress indicators
10. Implement advanced security features
11. Cross-platform optimization
12. Performance optimization for very large files

## Success Criteria

1. ✅ Image attachments (PNG, JPG, GIF) download correctly
2. ✅ Document attachments (PDF, DOC, TXT) download correctly  
3. ✅ IPC method works reliably for all file types
4. ✅ Fallback method works when IPC fails
5. ✅ Users receive clear success/error feedback
6. ✅ No existing functionality is broken
7. ✅ Edge cases are handled gracefully
8. ✅ Performance is acceptable for typical file sizes (<10MB)

## Debugging Steps

1. Add detailed console logging to both main.js and VaultHelpers.tsx
2. Test with known good and bad base64 strings
3. Verify IPC communication is working properly
4. Check file system permissions
5. Test with various file formats and sizes
6. Monitor memory usage during downloads

## Notes

- The current code structure is good - both IPC and fallback methods exist
- The issue seems to be primarily in the base64 processing and error handling
- Focus on making the existing code more robust rather than rewriting
- Consider security implications when implementing fixes
- Test thoroughly before deploying to production
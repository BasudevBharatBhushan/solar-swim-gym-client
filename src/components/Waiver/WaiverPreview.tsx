import React from 'react';
import { Box, Card, Checkbox, FormControlLabel, Typography, useTheme, useMediaQuery } from '@mui/material';
import ReactQuill from 'react-quill-new';
// Import Quill's own stylesheet here so WaiverPreview is self-contained.
import 'react-quill-new/dist/quill.snow.css';

interface WaiverPreviewProps {
  content: string;
  data: {
    first_name: string;
    last_name: string;
    guardian_name?: string;
  };
  agreed: boolean;
  onAgreeChange: (checked: boolean) => void;
  signatureComponent?: React.ReactNode;
  hideCheckbox?: boolean;
  fullHeight?: boolean;
}

/**
 * WaiverPreview component that renders Quill content using ReactQuill in read-only mode
 * for an exact formatting match with the editor.
 */
export const WaiverPreview: React.FC<WaiverPreviewProps> = ({ 
  content, 
  data, 
  agreed, 
  onAgreeChange, 
  signatureComponent,
  hideCheckbox = false,
  fullHeight = false
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const processContent = () => {
    let html = content;
    // Perform variable replacements
    html = html.replace(/\[FullName\]/g, `${data.first_name} ${data.last_name}`);
    html = html.replace(/\[GuardianName\]/g, data.guardian_name || 'N/A');
    html = html.replace(/\[CurrentDate\]/g, new Date().toLocaleDateString());

    const parts = html.split('[AcceptSignature]');

    // Quill formatting overrides for the preview container
    const editorStyles = {
      '& .ql-container.ql-snow': {
        border: 'none',
        fontFamily: 'inherit',
        fontSize: 'inherit',
      },
      '& .ql-editor': {
        padding: 0,
        height: 'auto',
        overflow: 'visible',
        color: '#1e293b',
        lineHeight: 1.5,
      },
      // Ensure justified text look good without letter gaps
      '& .ql-align-justify': {
        textAlign: 'justify',
        textAlignLast: 'left',
      },
      '& img': {
        maxWidth: '100%',
        height: 'auto',
        borderRadius: '4px',
      },
      '& blockquote': {
        borderLeft: '4px solid #e2e8f0',
        paddingLeft: '1.5em',
        margin: '1.5em 0',
        color: '#475569',
        fontStyle: 'italic',
      }
    };

    const QuillViewer = ({ value }: { value: string }) => (
      <Box sx={editorStyles}>
        <ReactQuill
          value={value}
          readOnly={true}
          theme="snow"
          modules={{ toolbar: false }}
        />
      </Box>
    );

    const SignatureBlock = () => (
      <Box sx={{ 
        my: 4, 
        p: { xs: 2, md: 3 }, 
        border: '2px dashed #cbd5e1', 
        borderRadius: 2, 
        bgcolor: '#f8fafc', 
        textAlign: 'center' 
      }}>
        <Typography variant="overline" gutterBottom color="text.secondary" sx={{ fontWeight: 800, mb: 2, display: 'block' }}>
          PLEASE PROVIDE YOUR SIGNATURE BELOW
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          {signatureComponent}
        </Box>
      </Box>
    );

    return (
      <Box 
        sx={{ 
          maxWidth: '816px', // Standard US Letter width
          width: '100%',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          boxShadow: isSmallScreen ? 'none' : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          padding: { xs: 2, md: 8 }, // Generous margins like a real document
          minHeight: fullHeight ? 'auto' : '1000px',
          borderRadius: '2px',
        }}
      >
        {parts.length > 1 && signatureComponent ? (
          <>
            <QuillViewer value={parts[0]} />
            <SignatureBlock />
            <QuillViewer value={parts[1]} />
          </>
        ) : (
          <>
            <QuillViewer value={html} />
            {signatureComponent && <SignatureBlock />}
          </>
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Card
        variant="outlined"
        sx={{
          maxHeight: fullHeight ? 'none' : 600,
          overflowY: 'auto',
          p: { xs: 0, md: 4 }, // Remove outer padding on mobile to maximize paper width
          mb: hideCheckbox ? 0 : 2,
          backgroundColor: '#f1f5f9', // Professional grey background
          border: 'none',
          borderRadius: 2,
        }}
      >
        {processContent()}
      </Card>

      {!hideCheckbox && (
        <Box sx={{ mt: 2, px: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={agreed}
                onChange={(e) => onAgreeChange(e.target.checked)}
                color="primary"
                sx={{ transform: 'scale(1.2)' }}
              />
            }
            label={
              <Typography variant="body1" sx={{ fontWeight: 600, ml: 1, color: '#1e293b' }}>
                I have read and agree to all terms and conditions
              </Typography>
            }
          />
        </Box>
      )}
    </Box>
  );
};

import React from 'react';
import { Box, Card, Checkbox, FormControlLabel, Typography, useTheme, useMediaQuery } from '@mui/material';
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
 * WaiverPreview component that renders Quill HTML content in a document-like format.
 * Designed to look like a US Letter page (8.5" x 11") to preserve formatting and
 * prevent excessive line lengths that lead to justification gaps.
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
    html = html.replace(/\[FullName\]/g, `${data.first_name} ${data.last_name}`);
    html = html.replace(/\[GuardianName\]/g, data.guardian_name || 'N/A');
    html = html.replace(/\[CurrentDate\]/g, new Date().toLocaleDateString());

    const parts = html.split('[AcceptSignature]');

    // Scoped overrides on top of quill.snow.css.
    const scopedStyles = `
      .ql-waiver-preview.ql-editor {
        padding: 0 !important;
        border: none !important;
        font-family: 'Inter', Arial, sans-serif;
        font-size: 14px;
        line-height: 1.6;
        box-sizing: border-box;
        color: #1e293b;
      }
      .ql-waiver-preview.ql-editor p  { 
        margin-bottom: 0.75em; 
        text-align: inherit;
        hyphens: auto;
      }
      .ql-waiver-preview.ql-editor h1 { font-size: 2em;    font-weight: bold; margin: 0.75em 0 0.5em; color: #0f172a; }
      .ql-waiver-preview.ql-editor h2 { font-size: 1.5em;  font-weight: bold; margin: 0.75em 0 0.5em; color: #1e293b; }
      .ql-waiver-preview.ql-editor h3 { font-size: 1.17em; font-weight: bold; margin: 0.75em 0 0.5em; }
      .ql-waiver-preview.ql-editor .ql-align-center  { text-align: center  !important; }
      .ql-waiver-preview.ql-editor .ql-align-right   { text-align: right   !important; }
      .ql-waiver-preview.ql-editor .ql-align-justify { 
        text-align: justify !important; 
        text-justify: inter-word !important;
      }
      .ql-waiver-preview.ql-editor blockquote {
        border-left: 4px solid #e2e8f0;
        padding-left: 1.5em;
        margin: 1.5em 0;
        color: #475569;
        font-style: italic;
      }
      .ql-waiver-preview.ql-editor pre {
        background: #f1f5f9;
        padding: 1em;
        border-radius: 6px;
        font-family: 'Fira Code', monospace;
        font-size: 12px;
        white-space: pre-wrap;
        margin: 1em 0;
      }
      .ql-waiver-preview.ql-editor img { max-width: 100%; height: auto; border-radius: 4px; }
      .ql-waiver-preview.ql-editor .ql-size-small { font-size: 0.85em; }
      .ql-waiver-preview.ql-editor .ql-size-large { font-size: 1.5em; }
      .ql-waiver-preview.ql-editor .ql-size-huge  { font-size: 2.5em; }
      
      /* Reset list margins to fit standard document look */
      .ql-waiver-preview.ql-editor ol, .ql-waiver-preview.ql-editor ul {
        padding-left: 1.5em;
        margin-bottom: 1em;
      }
    `;

    const RenderedHTML = ({ htmlContent }: { htmlContent: string }) => (
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    );

    return (
      <Box 
        className="ql-editor ql-snow ql-waiver-preview"
        sx={{ 
          maxWidth: '816px', // Standard US Letter width at 96 DPI
          width: '100%',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          boxShadow: isSmallScreen ? 'none' : '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          padding: { xs: 2, md: 6 },
          minHeight: fullHeight ? 'auto' : '1000px',
          borderRadius: '2px',
        }}
      >
        <style>{scopedStyles}</style>
        
        {parts.length > 1 && signatureComponent ? (
          <>
            <RenderedHTML htmlContent={parts[0]} />
            <Box sx={{ my: 4, p: 3, border: '2px dashed #cbd5e1', borderRadius: 2, bgcolor: '#f8fafc', textAlign: 'center' }}>
              <Typography variant="subtitle2" gutterBottom color="text.secondary" sx={{ fontWeight: 600, mb: 2 }}>
                PLEASE PROVIDE YOUR SIGNATURE BELOW
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                {signatureComponent}
              </Box>
            </Box>
            <RenderedHTML htmlContent={parts[1]} />
          </>
        ) : (
          <>
            <RenderedHTML htmlContent={html} />
            {signatureComponent && (
              <Box sx={{ mt: 4, p: 3, border: '2px dashed #cbd5e1', borderRadius: 2, bgcolor: '#f8fafc', textAlign: 'center' }}>
                <Typography variant="subtitle2" gutterBottom color="text.secondary" sx={{ fontWeight: 600, mb: 2 }}>
                  PLEASE PROVIDE YOUR SIGNATURE BELOW
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  {signatureComponent}
                </Box>
              </Box>
            )}
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
          p: { xs: 1, md: 4 },
          mb: hideCheckbox ? 0 : 2,
          backgroundColor: '#f1f5f9', // Light background to contrast with the "paper"
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
                sx={{ 
                  '&.Mui-checked': { color: theme.palette.primary.main },
                  transform: 'scale(1.2)'
                }}
              />
            }
            label={
              <Typography variant="body1" sx={{ fontWeight: 600, ml: 1 }}>
                I have read and agree to all terms and conditions stated in this waiver.
              </Typography>
            }
          />
        </Box>
      )}
    </Box>
  );
};

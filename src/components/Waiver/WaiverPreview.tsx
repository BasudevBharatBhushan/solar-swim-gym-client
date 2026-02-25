import React from 'react';
import { Box, Card, Checkbox, FormControlLabel, Typography } from '@mui/material';
// Import Quill's own stylesheet here so WaiverPreview is self-contained.
// Without this, formatting (bullets, numbered lists, alignment, sizes) only
// renders correctly on pages that already import ReactQuill (like WaiverTemplates.tsx)
// but breaks everywhere else — that's why the signing dialog on AccountDetail looked wrong.
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

export const WaiverPreview: React.FC<WaiverPreviewProps> = ({ 
  content, 
  data, 
  agreed, 
  onAgreeChange, 
  signatureComponent,
  hideCheckbox = false,
  fullHeight = false
}) => {

  const processContent = () => {
    let html = content;
    html = html.replace(/\[FullName\]/g, `${data.first_name} ${data.last_name}`);
    html = html.replace(/\[GuardianName\]/g, data.guardian_name || 'N/A');
    html = html.replace(/\[CurrentDate\]/g, new Date().toLocaleDateString());

    const parts = html.split('[AcceptSignature]');

    // Scoped overrides on top of quill.snow.css.
    // Using .ql-waiver-preview as an extra specificity class so these rules
    // never collide with a live ReactQuill editor open on the same page.
    const scopedStyles = `
      .ql-waiver-preview.ql-editor {
        padding: 0 !important;
        border: none !important;
        font-family: inherit;
        font-size: 14px;
        line-height: 1.6;
        box-sizing: border-box;
      }
      .ql-waiver-preview.ql-editor p  { margin-bottom: 0.75em; }
      .ql-waiver-preview.ql-editor h1 { font-size: 2em;    font-weight: bold; margin: 0.75em 0 0.5em; }
      .ql-waiver-preview.ql-editor h2 { font-size: 1.5em;  font-weight: bold; margin: 0.75em 0 0.5em; }
      .ql-waiver-preview.ql-editor h3 { font-size: 1.17em; font-weight: bold; margin: 0.75em 0 0.5em; }
      .ql-waiver-preview.ql-editor h4 { font-size: 1em;    font-weight: bold; margin: 0.75em 0 0.5em; }
      .ql-waiver-preview.ql-editor h5 { font-size: 0.83em; font-weight: bold; margin: 0.75em 0 0.5em; }
      .ql-waiver-preview.ql-editor h6 { font-size: 0.67em; font-weight: bold; margin: 0.75em 0 0.5em; }
      .ql-waiver-preview.ql-editor .ql-align-center  { text-align: center  !important; }
      .ql-waiver-preview.ql-editor .ql-align-right   { text-align: right   !important; }
      .ql-waiver-preview.ql-editor .ql-align-justify { text-align: justify !important; }
      .ql-waiver-preview.ql-editor blockquote {
        border-left: 4px solid #ccc;
        padding-left: 1em;
        margin-left: 0;
        color: #555;
      }
      .ql-waiver-preview.ql-editor pre {
        background: #f4f4f4;
        padding: 0.5em;
        border-radius: 4px;
        font-family: monospace;
        font-size: 12px;
        white-space: pre-wrap;
      }
      .ql-waiver-preview.ql-editor img         { max-width: 100%; height: auto; }
      .ql-waiver-preview.ql-editor .ql-size-small { font-size: 10px; }
      .ql-waiver-preview.ql-editor .ql-size-large { font-size: 18px; }
      .ql-waiver-preview.ql-editor .ql-size-huge  { font-size: 24px; }
    `;

    // Split at [AcceptSignature] to insert the signature pad inline
    if (parts.length > 1 && signatureComponent) {
      return (
        <div className="ql-editor ql-snow ql-waiver-preview">
          <style>{scopedStyles}</style>
          <div dangerouslySetInnerHTML={{ __html: parts[0] }} />
          <Box sx={{ my: 3, p: 2, border: '1px dashed #ccc', borderRadius: 1, bgcolor: '#fff' }}>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Please sign below:
            </Typography>
            {signatureComponent}
          </Box>
          <div dangerouslySetInnerHTML={{ __html: parts[1] }} />
        </div>
      );
    }

    return (
      <div className="ql-editor ql-snow ql-waiver-preview">
        <style>{scopedStyles}</style>
        <div dangerouslySetInnerHTML={{ __html: html }} />
        {signatureComponent && (
          <Box sx={{ mt: 3, p: 2, border: '1px dashed #ccc', borderRadius: 1, bgcolor: '#fff' }}>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Please sign below:
            </Typography>
            {signatureComponent}
          </Box>
        )}
      </div>
    );
  };

  return (
    <Box>
      <Card
        variant="outlined"
        sx={{
          maxHeight: fullHeight ? 'none' : 400,
          overflowY: fullHeight ? 'visible' : 'auto',
          p: 3,
          mb: hideCheckbox ? 0 : 2,
          backgroundColor: '#f8fafc',
        }}
      >
        {processContent()}
      </Card>

      {!hideCheckbox && (
        <FormControlLabel
          control={
            <Checkbox
              checked={agreed}
              onChange={(e) => onAgreeChange(e.target.checked)}
              color="primary"
            />
          }
          label="I have read and agree to the terms above"
        />
      )}
    </Box>
  );
};

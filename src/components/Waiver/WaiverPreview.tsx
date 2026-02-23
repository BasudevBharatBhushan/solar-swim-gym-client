import React from 'react';
import { Box, Card, Checkbox, FormControlLabel, Typography } from '@mui/material';

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
  // Variable replacement and HTML split
  const processContent = () => {
    let html = content;
    html = html.replace(/\[FullName\]/g, `${data.first_name} ${data.last_name}`);
    html = html.replace(/\[GuardianName\]/g, data.guardian_name || 'N/A');
    html = html.replace(/\[CurrentDate\]/g, new Date().toLocaleDateString());

    const parts = html.split('[AcceptSignature]');

    if (parts.length > 1 && signatureComponent) {
        return (
            <div className="ql-editor" style={{ fontFamily: 'inherit', fontSize: '14px', lineHeight: '1.6', padding: 0 }}>
                <style>
                    {`
                    .ql-editor .ql-align-center { text-align: center; }
                    .ql-editor .ql-align-right { text-align: right; }
                    .ql-editor .ql-align-justify { text-align: justify; }
                    .ql-editor ul, .ql-editor ol { padding-left: 1.5em; margin-bottom: 1em; }
                    .ql-editor li { margin-bottom: 0.5em; }
                    .ql-editor img { max-width: 100%; height: auto; }
                    .ql-editor .ql-indent-1:not(.ql-direction-rtl) { padding-left: 3em; }
                    .ql-editor li.ql-indent-1:not(.ql-direction-rtl) { padding-left: 4.5em; }
                    .ql-editor .ql-indent-2:not(.ql-direction-rtl) { padding-left: 6em; }
                    .ql-editor li.ql-indent-2:not(.ql-direction-rtl) { padding-left: 7.5em; }
                    .ql-editor .ql-indent-3:not(.ql-direction-rtl) { padding-left: 9em; }
                    .ql-editor li.ql-indent-3:not(.ql-direction-rtl) { padding-left: 10.5em; }
                    `}
                </style>
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
        <div className="ql-editor" style={{ fontFamily: 'inherit', fontSize: '14px', lineHeight: '1.6', padding: 0 }}>
            <style>
                {`
                .ql-editor .ql-align-center { text-align: center; }
                .ql-editor .ql-align-right { text-align: right; }
                .ql-editor .ql-align-justify { text-align: justify; }
                .ql-editor ul, .ql-editor ol { padding-left: 1.5em; margin-bottom: 1em; }
                .ql-editor li { margin-bottom: 0.5em; }
                .ql-editor img { max-width: 100%; height: auto; }
                .ql-editor .ql-indent-1:not(.ql-direction-rtl) { padding-left: 3em; }
                .ql-editor li.ql-indent-1:not(.ql-direction-rtl) { padding-left: 4.5em; }
                .ql-editor .ql-indent-2:not(.ql-direction-rtl) { padding-left: 6em; }
                .ql-editor li.ql-indent-2:not(.ql-direction-rtl) { padding-left: 7.5em; }
                .ql-editor .ql-indent-3:not(.ql-direction-rtl) { padding-left: 9em; }
                .ql-editor li.ql-indent-3:not(.ql-direction-rtl) { padding-left: 10.5em; }
                `}
            </style>
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
            backgroundColor: '#f8fafc' 
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

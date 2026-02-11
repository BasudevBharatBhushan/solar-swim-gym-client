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
}

export const WaiverPreview: React.FC<WaiverPreviewProps> = ({ content, data, agreed, onAgreeChange, signatureComponent }) => {
  // Variable replacement and HTML split
  const processContent = () => {
    let html = content;
    html = html.replace(/\[FullName\]/g, `${data.first_name} ${data.last_name}`);
    html = html.replace(/\[GuardianName\]/g, data.guardian_name || 'N/A');
    html = html.replace(/\[CurrentDate\]/g, new Date().toLocaleDateString());

    const parts = html.split('[AcceptSignature]');

    if (parts.length > 1 && signatureComponent) {
        return (
            <div style={{ fontFamily: 'inherit', fontSize: '14px', lineHeight: '1.6' }}>
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
        <div style={{ fontFamily: 'inherit', fontSize: '14px', lineHeight: '1.6' }}>
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
      <Card variant="outlined" sx={{ maxHeight: 400, overflowY: 'auto', p: 3, mb: 2, backgroundColor: '#f8fafc' }}>
        {processContent()}
      </Card>
      
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
    </Box>
  );
};

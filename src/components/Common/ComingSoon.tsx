import React from 'react';
import { Box, Typography, Paper, Button, Container, Stack } from '@mui/material';
import { RocketLaunch, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from './PageHeader';

interface ComingSoonProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string; active?: boolean }[];
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ 
  title, 
  description = "This feature is currently under development. Stay tuned for exciting updates!",
  icon = <RocketLaunch sx={{ fontSize: 60, color: '#3b82f6' }} />,
  breadcrumbs
}) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 3, maxWidth: 1600, mx: 'auto', minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      {breadcrumbs && (
        <PageHeader
          title={title}
          description={description}
          breadcrumbs={breadcrumbs}
        />
      )}

      <Container maxWidth="md" sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 8 },
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
            }
          }}
        >
          {/* Animated Background Element */}
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.03)',
              zIndex: 0,
            }}
          />

          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              p: 3,
              borderRadius: '50%',
              bgcolor: 'rgba(59, 130, 246, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1,
              animation: 'float 3s ease-in-out infinite',
              '@keyframes float': {
                '0%, 100%': { transform: 'translateY(0)' },
                '50%': { transform: 'translateY(-10px)' },
              }
            }}
          >
            {icon}
          </Box>

          <Stack spacing={2} sx={{ position: 'relative', zIndex: 1, alignItems: 'center' }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: '#1e293b',
                letterSpacing: '-1px',
                fontSize: { xs: '2rem', md: '3rem' }
              }}
            >
              {title}
            </Typography>
            
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: '#3b82f6',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                fontSize: '0.875rem'
              }}
            >
              Coming Soon
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: '#64748b',
                maxWidth: '500px',
                lineHeight: 1.6,
                fontSize: '1.1rem'
              }}
            >
              {description}
            </Typography>
          </Stack>

          <Box sx={{ mt: 2, position: 'relative', zIndex: 1 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#e2e8f0',
                color: '#475569',
                '&:hover': {
                  borderColor: '#cbd5e1',
                  bgcolor: '#f1f5f9',
                }
              }}
            >
              Go Back
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top right, #f8fafc 0%, #eff6ff 50%, #f0fdf4 100%)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Decorative blobs */}
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '40vw',
          height: '40vw',
          background: 'rgba(59, 130, 246, 0.05)',
          borderRadius: '50%',
          filter: 'blur(80px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: '30vw',
          height: '30vw',
          background: 'rgba(16, 185, 129, 0.05)',
          borderRadius: '50%',
          filter: 'blur(80px)',
        }}
      />

      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box
            sx={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: 6,
              borderRadius: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                letterSpacing: '0.3em',
                color: '#1e293b',
                mb: 6,
                fontSize: '3rem',
                opacity: 0.8,
              }}
            >
              ZALEXY
            </Typography>

            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '6rem', md: '8rem' },
                fontWeight: 900,
                background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1,
                mb: 1,
              }}
            >
              404
            </Typography>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#1e293b',
                mb: 2,
              }}
            >
              Page Not Found
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: '#64748b',
                mb: 4,
                maxWidth: '80%',
                fontSize: '1.1rem',
              }}
            >
              Oops! The page you are looking for doesn't exist or has been moved.
            </Typography>

            <Button
              variant="contained"
              size="large"
              startIcon={<HomeRoundedIcon />}
              onClick={() => navigate('/')}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 600,
                backgroundColor: '#3b82f6',
                boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)',
                '&:hover': {
                  backgroundColor: '#2563eb',
                  boxShadow: '0 6px 20px rgba(59, 130, 246, 0.23)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.2s',
              }}
            >
              Back to Home
            </Button>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default NotFound;

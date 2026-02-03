import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  breadcrumbs?: { label: string; href?: string; active?: boolean }[];
}

export const PageHeader = ({ title, description, action, breadcrumbs }: PageHeaderProps) => {
  return (
    <Box sx={{ mb: 4 }}>
      {breadcrumbs && (
        <Breadcrumbs sx={{ mb: 2, fontSize: '0.875rem' }}>
          {breadcrumbs.map((crumb, idx) => (
             <Link 
                key={idx} 
                color={crumb.active ? "text.primary" : "text.secondary"} 
                underline={crumb.active ? "none" : "hover"}
                href={crumb.href || '#'}
                sx={{ 
                    fontWeight: crumb.active ? 600 : 400,
                    pointerEvents: crumb.active ? 'none' : 'auto'
                }}
             >
               {crumb.label}
             </Link>
          ))}
        </Breadcrumbs>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h2" sx={{ mb: 1, fontSize: '1.5rem', letterSpacing: '-0.02em', color: 'text.primary' }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '800px' }}>
              {description}
            </Typography>
          )}
        </Box>
        {action && (
          <Box sx={{ mt: 1 }}>
            {action}
          </Box>
        )}
      </Box>
    </Box>
  );
};

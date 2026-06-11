import React from 'react';
import { Box, Container, Grid, Typography, Button } from '@mui/material';
import { Phone, Mail, HelpCircle, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <Box mt={8} py={6} style={{ background: '#090D1A', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          
          {/* Support options */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom fontWeight={700} className="text-gradient">
              Customer Support
            </Typography>
            <Typography variant="body2" color="textSecondary" mb={2}>
              Need help? Reach out to our customer care team available 24/7.
            </Typography>
            <Box display="flex" flexDirection="column" gap="10px">
              <Box display="flex" alignItems="center" gap="10px">
                <Phone size={16} color="#7C3AED" />
                <Typography variant="body2">+1-800-CINE-HUB (Support Line)</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap="10px">
                <Phone size={16} color="#EC4899" />
                <Typography variant="body2">+1-800-BOOK-NOW (Book by Call)</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap="10px">
                <Mail size={16} color="#7C3AED" />
                <Typography variant="body2">help@cinehub.com</Typography>
              </Box>
            </Box>
          </Grid>

          {/* About Section */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" gutterBottom fontWeight={700}>
              About CineHub
            </Typography>
            <Typography variant="body2" color="textSecondary" mb={2}>
              CineHub is a next-generation entertainment ticket booking system. Explore films, plays, standup comedy, stadium sports, workshops, and concerts near you.
            </Typography>
            <Box display="flex" gap="12px">
              <IconButtonComponent href="https://facebook.com" icon={<Facebook size={18} />} />
              <IconButtonComponent href="https://instagram.com" icon={<Instagram size={18} />} />
              <IconButtonComponent href="https://twitter.com" icon={<Twitter size={18} />} />
              <IconButtonComponent href="https://youtube.com" icon={<Youtube size={18} />} />
            </Box>
          </Grid>

          {/* Quick FAQ links */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" gutterBottom fontWeight={700}>
              Help & FAQs
            </Typography>
            <Box display="flex" flexDirection="column" gap="8px">
              <LinkComponent text="How to reserve seats (Book Later)?" />
              <LinkComponent text="How does Group Booking Planner work?" />
              <LinkComponent text="Redeeming Reward Points and Tokens" />
              <LinkComponent text="Cancellation and refund policies" />
            </Box>
          </Grid>

        </Grid>

        <Box mt={6} pt={3} borderTop="1px solid rgba(255,255,255,0.04)" display="flex" justifyContent="space-between" flexWrap="wrap" gap="12px">
          <Typography variant="caption" color="textSecondary">
            © 2026 CineHub Entertainment Ltd. All rights reserved.
          </Typography>
          <Box display="flex" gap="16px">
            <Typography variant="caption" color="textSecondary" style={{ cursor: 'pointer' }}>Privacy Policy</Typography>
            <Typography variant="caption" color="textSecondary" style={{ cursor: 'pointer' }}>Terms of Service</Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

const IconButtonComponent = ({ href, icon }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      background: 'rgba(255,255,255,0.05)',
      color: '#FFFFFF',
      padding: '8px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 0.2s',
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = '#7C3AED')}
    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
  >
    {icon}
  </a>
);

const LinkComponent = ({ text }) => (
  <span
    style={{ color: '#94A3B8', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
    onMouseEnter={(e) => (e.currentTarget.style.color = '#EC4899')}
    onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
  >
    <HelpCircle size={14} />
    {text}
  </span>
);

export default Footer;

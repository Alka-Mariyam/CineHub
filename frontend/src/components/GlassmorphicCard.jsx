import React from 'react';
import { motion } from 'framer-motion';

const GlassmorphicCard = ({ children, onClick, className = '', ...props }) => {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`glass-panel glass-card cursor-pointer overflow-hidden relative ${className}`}
      style={{
        borderRadius: '16px',
        boxShadow: '0 8px 32px 0 rgba(15, 23, 42, 0.4)',
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassmorphicCard;

import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Box, Button, Paper } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';

export interface SignaturePadRef {
  clear: () => void;
  getCanvas: () => HTMLCanvasElement | null;
  isEmpty: () => boolean;
}

interface SignaturePadProps {
  onEnd?: () => void;
  width?: number;
  height?: number;
}

export const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(({ 
    onEnd, 
    width = 500, 
    height = 200 
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [hasSignature, setHasSignature] = useState(false);

  useImperativeHandle(ref, () => ({
    clear: () => clearCanvas(),
    getCanvas: () => canvasRef.current,
    isEmpty: () => !hasSignature
  }));

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        context.lineWidth = 2;
        context.lineCap = 'round';
        context.strokeStyle = '#000000';
        setCtx(context);
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    if (isDrawing) {
        setIsDrawing(false);
        if (ctx) ctx.beginPath();
        if (onEnd) onEnd();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !ctx || !canvasRef.current) return;

    e.preventDefault();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let x, y;
    if ('touches' in e) {
        const touch = e.touches[0];
        x = touch.clientX - rect.left;
        y = touch.clientY - rect.top;
    } else {
        const mouse = e as React.MouseEvent;
        x = mouse.clientX - rect.left;
        y = mouse.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasSignature(true);
  };

  const clearCanvas = () => {
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setHasSignature(false);
    }
  };

  return (
    <Box>
      <Paper variant="outlined" sx={{ display: 'inline-block', overflow: 'hidden', touchAction: 'none', bgcolor: '#fff' }}>
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseMove={draw}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchEnd={stopDrawing}
            onTouchMove={draw}
            style={{ cursor: 'crosshair', display: 'block' }}
        />
      </Paper>
      <Box sx={{ mt: 1 }}>
        <Button 
            size="small" 
            variant="text" 
            color="error" 
            startIcon={<ClearIcon />} 
            onClick={clearCanvas}
        >
            Clear Signature
        </Button>
      </Box>
    </Box>
  );
});

export const getSignatureBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> => {
    return new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png');
    });
};

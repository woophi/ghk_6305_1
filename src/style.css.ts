import { style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';

const bottomBtn = style({
  position: 'fixed',
  zIndex: 2,
  width: '100%',
  padding: '12px',
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  backgroundColor: '#FFFFFF',
});

const container = style({
  display: 'flex',
  padding: '1rem',
  flexDirection: 'column',
  gap: '1rem',
});

const cell = recipe({
  base: {
    padding: '12px',
    borderRadius: '10px',
    backgroundColor: '#EEEEFB8C',
    border: '1px solid transparent',
    transition: 'all 0.3s ease-in-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  variants: {
    selected: {
      true: {
        border: '1px solid #2A77EF',
        backgroundColor: '#E8F2FE',
        color: '#2A77EF',
      },
    },
  },
});

const box = style({
  backgroundColor: '#EEEEFB8C',
  borderRadius: '12px',
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
});

const row = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const appSt = {
  bottomBtn,
  container,
  row,
  cell,
  box,
};

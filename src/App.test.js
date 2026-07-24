import { render, screen } from '@testing-library/react';
import App from './App';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

test('renders Player Dashboard header name', () => {
  render(<App />);
  expect(screen.getByText(/Player Dashboard/i)).toBeInTheDocument();
});

test('renders player select dropdown', () => {
  render(<App />);
  expect(screen.getByRole('combobox', { name: /player/i })).toBeInTheDocument();
});

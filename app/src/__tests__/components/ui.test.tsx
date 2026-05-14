import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Header } from '@/components/layout/shell';
import { Users, Calendar } from 'lucide-react';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Test</Badge>);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    const { container } = render(<Badge variant="success">Success</Badge>);
    expect(container.firstChild).toHaveClass('bg-green-100');
  });

  it('applies custom color for custom variant', () => {
    const { container } = render(<Badge variant="custom" color="#FF0000">Custom</Badge>);
    const span = container.firstChild as HTMLElement;
    expect(span.style.backgroundColor).toBeTruthy();
    expect(span.style.color).toBe('rgb(255, 0, 0)');
  });

  it('applies className prop', () => {
    render(<Badge className="extra-class">Test</Badge>);
    expect(screen.getByText('Test')).toHaveClass('extra-class');
  });
});

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    const { container } = render(<Button loading>Loading</Button>);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('is disabled when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies variant styles', () => {
    const { container } = render(<Button variant="danger">Danger</Button>);
    expect(container.firstChild).toHaveClass('bg-red-600');
  });

  it('applies size styles', () => {
    const { container } = render(<Button size="lg">Large</Button>);
    expect(container.firstChild).toHaveClass('px-6');
  });

  it('handles click events', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Click</Button>);
    await user.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe('Modal', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
  });

  it('does not render when closed', () => {
    const { container } = render(
      <Modal open={false} onClose={vi.fn()}>
        <p>Content</p>
      </Modal>
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders content when open', () => {
    render(
      <Modal open={true} onClose={vi.fn()} title="Test Modal">
        <p>Modal Content</p>
      </Modal>
    );
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  it('calls onClose when clicking backdrop', () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose}>
        <p>Content</p>
      </Modal>
    );
    fireEvent.click(screen.getByRole('presentation'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when pressing Escape', () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose}>
        <p>Content</p>
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders close button', () => {
    render(
      <Modal open={true} onClose={vi.fn()}>
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByLabelText('Cerrar')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <Modal open={true} onClose={vi.fn()} title="Accessible Modal">
        <p>Content</p>
      </Modal>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});

describe('EmptyState', () => {
  it('renders icon, title, description', () => {
    render(
      <EmptyState
        icon={Users}
        title="No users"
        description="No users found"
      />
    );
    expect(screen.getByText('No users')).toBeInTheDocument();
    expect(screen.getByText('No users found')).toBeInTheDocument();
  });

  it('renders action when provided', () => {
    render(
      <EmptyState
        icon={Calendar}
        title="Empty"
        action={<button>Add New</button>}
      />
    );
    expect(screen.getByText('Add New')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = render(
      <EmptyState icon={Users} title="No data" />
    );
    const descElements = container.querySelectorAll('.text-sm.text-zinc-500');
    expect(descElements.length).toBe(0);
  });
});

describe('ErrorBanner', () => {
  it('renders default message', () => {
    render(<ErrorBanner />);
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
    expect(screen.getByText('Error al cargar datos')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<ErrorBanner message="Custom error" />);
    expect(screen.getByText('Custom error')).toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', () => {
    const onRetry = vi.fn();
    render(<ErrorBanner onRetry={onRetry} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onRetry when clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorBanner onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('does not render button when onRetry is not provided', () => {
    const { container } = render(<ErrorBanner />);
    expect(container.querySelector('button')).toBeNull();
  });
});

describe('Header', () => {
  it('renders title when provided', () => {
    render(<Header title="Dashboard" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders action when provided', () => {
    render(<Header title="Test" action={<button>Action</button>} />);
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('does not render title when not provided', () => {
    const { container } = render(<Header />);
    const h1 = container.querySelector('h1');
    expect(h1).toBeNull();
  });
});

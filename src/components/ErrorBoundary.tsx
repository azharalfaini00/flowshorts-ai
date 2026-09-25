import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#09090b',
            padding: '24px',
            gap: '16px',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              background: '#18181b',
              border: '1px solid #3f3f46',
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
              <h2 style={{ color: '#f43f5e', fontWeight: 700, fontSize: '16px', margin: 0 }}>
                Terjadi Kesalahan Tampilan
              </h2>
            </div>
            <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: 1.6, marginBottom: '8px' }}>
              Komponen mengalami crash saat memproses data dari AI. Data mungkin dikembalikan dalam format yang tidak lengkap.
            </p>
            <p style={{ color: '#71717a', fontSize: '11px', fontFamily: 'monospace', background: '#09090b', padding: '10px', borderRadius: '8px', wordBreak: 'break-all', marginBottom: '16px' }}>
              {this.state.error?.message || 'Unknown error'}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={this.handleReset}
                style={{
                  flex: 1,
                  background: '#f43f5e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                🔄 Reset & Coba Lagi
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  flex: 1,
                  background: '#27272a',
                  color: '#d4d4d8',
                  border: '1px solid #3f3f46',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                🔃 Muat Ulang Halaman
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

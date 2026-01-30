export default function LoadingSpinner({ size = 24 }: { size?: number }) {
    return (
        <div className="loading-spinner" style={{ width: size, height: size }}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeOpacity="0.2"
                />
                <path
                    d="M12 2C6.47715 2 2 6.47715 2 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="spinner-path"
                />
            </svg>
        </div>
    );
}

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-6 py-4">
        <div className="text-center text-sm text-muted-foreground">
          Developed by{" "}
          <a
            href="https://sirahdigital.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            Sirah Digital
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

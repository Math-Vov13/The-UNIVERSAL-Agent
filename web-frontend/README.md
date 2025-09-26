# Universal Agent RAG - Web ChatBot Interface

A modern web interface built with Next.js for interacting with a RAG (Retrieval-Augmented Generation) powered chatbot.

## Features

- 💬 Real-time chat interface
- 🤖 Integration with RAG chatbot system
- 🎨 Modern and responsive design
- ⚡ Performance optimized with Next.js 14+
- 🔍 Conversation search functionality
- 📱 Mobile and desktop compatible

## Prerequisites

- Node.js 18.0 or later
- npm, yarn, pnpm, or bun

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd web-frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

Edit the `.env.local` file with your configurations:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8000/ws
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Project Structure

```
web-frontend/
├── app/                    # App Router (Next.js 13+)
│   ├── chat/              # Chat pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Main layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── chat/             # Chat-specific components
│   └── layout/           # Layout components
├── lib/                  # Utilities and configurations
├── hooks/                # Custom React hooks
├── types/                # TypeScript definitions
└── public/               # Static assets
```

## Available Scripts

- `npm run dev` - Starts the development server
- `npm run build` - Builds the application for production
- `npm run start` - Starts the production server
- `npm run lint` - Runs ESLint
- `npm run type-check` - Checks TypeScript types

## API Configuration

The application communicates with a backend API for the chatbot functionality. Make sure your backend API is configured and accessible at the URLs specified in `.env.local`.

### Main endpoints:
- `POST /api/chat` - Send message to chatbot
- `GET /api/conversations` - Retrieve conversation history
- `WebSocket /ws` - Real-time connection for chat

## Deployment

### On Vercel (Recommended)

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

1. Connect your repository to [Vercel](https://vercel.com)
2. Configure environment variables in the Vercel dashboard
3. Deploy automatically on every push

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Other Platforms

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Technologies Used

- **Next.js 14+** - React framework
- **TypeScript** - Static typing
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.io** - Real-time communication
- **React Query** - State management and caching
- **Framer Motion** - Animations

## Fonts

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## Support

For help and support:
- Check the [Next.js documentation](https://nextjs.org/docs)
- Open an issue on this repository
- Contact the development team

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
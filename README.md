# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/aa4893ec-5fff-4f2d-b80c-0f93e749fb83

## API Setup for LearnWithAI

This project uses two APIs to generate personalized learning roadmaps:

### 1. OpenAI API Setup
- Get an API key from [OpenAI's Platform](https://platform.openai.com/api-keys)
- Add your API key to `.env`: `OPENAI_API_KEY=your-key-here`

### 2. Google Custom Search API Setup
- Create a project on [Google Cloud Console](https://console.cloud.google.com/)
- Enable the "Custom Search API" for your project
- Create API credentials at [Google API Console](https://console.developers.google.com/apis/credentials)
- Get your API key and add it to `.env`: `GOOGLE_API_KEY=your-google-api-key`
- Create a Programmable Search Engine at [Programmable Search Engine](https://programmablesearchengine.google.com/):
  - Click "Add" to create a new search engine
  - Choose to "Search the entire web" or specific sites
  - Get your Search Engine ID (cx value)
  - Add to `.env`: `GOOGLE_CSE_ID=your-search-engine-id`

When deploying to Vercel, add all these environment variables in the Vercel project settings.

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/aa4893ec-5fff-4f2d-b80c-0f93e749fb83) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/aa4893ec-5fff-4f2d-b80c-0f93e749fb83) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)

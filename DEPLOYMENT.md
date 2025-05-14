# WhatsApp Bot Deployment Guide

## Hosting on GitHub Pages

This guide will help you deploy your WhatsApp ChatGPT-powered bot online using GitHub Pages for free.

### Prerequisites

1. A GitHub account
2. Git installed on your computer
3. Your WhatsApp bot code (already in this repository)
4. Required API keys:
   - OpenAI API key
   - Wassenger API key

### Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in to your account
2. Click the "+" button in the top-right corner and select "New repository"
3. Name your repository (e.g., "whatsapp-chatgpt-bot")
4. Choose "Public" visibility
5. Click "Create repository"

### Step 2: Push Your Code to GitHub

```bash
# Initialize Git in your project folder (if not already done)
git init

# Add all files to Git
git add .

# Commit the files
git commit -m "Initial commit"

# Add the GitHub repository as a remote
git remote add origin https://github.com/YOUR_USERNAME/whatsapp-chatgpt-bot.git

# Push the code to GitHub
git push -u origin main
```

### Step 3: Configure GitHub Pages

1. Go to your repository on GitHub
2. Click on "Settings"
3. Scroll down to the "GitHub Pages" section
4. Under "Source", select "main" branch and "/docs" folder
5. Click "Save"

### Step 4: Create a docs folder for GitHub Pages

Create a `docs` folder in your repository with the following files:

1. `index.html` - Main landing page
2. `config.js` - Configuration file for your bot
3. `styles.css` - Styling for your landing page

### Step 5: Set Up Environment Variables

For security reasons, you should not commit your API keys to GitHub. Instead, use GitHub Secrets:

1. Go to your repository on GitHub
2. Click on "Settings"
3. Click on "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Add the following secrets:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `WASSENGER_API_KEY`: Your Wassenger API key
   - `WEBHOOK_URL`: Your webhook URL (will be set up later)

### Step 6: Configure Your Bot for Online Deployment

Update your `config.js` file to use environment variables:

```javascript
const config = {
  openaiKey: process.env.OPENAI_API_KEY || '',
  apiKey: process.env.WASSENGER_API_KEY || '',
  webhookUrl: process.env.WEBHOOK_URL || '',
  // Other configuration options...
};
```

### Step 7: Set Up a Webhook URL

You need a publicly accessible URL for your webhook. You can use a service like [Railway](https://railway.app/) or [Render](https://render.com/) to host your bot's server component.

1. Sign up for Railway or Render
2. Deploy your bot's server component
3. Get the public URL and set it as your `WEBHOOK_URL` in GitHub Secrets

### Step 8: Integrate the Tally Form

To integrate the Tally form (`https://tally.so/r/w4q5Mo`), add the following to your `index.html` in the docs folder:

```html
<div class="tally-form-container">
  <iframe
    src="https://tally.so/embed/w4q5Mo"
    width="100%"
    height="500"
    frameborder="0"
    marginheight="0"
    marginwidth="0"
    title="Say it now..when we still got time">
  </iframe>
</div>
```

You can also add a button in your WhatsApp bot to direct users to this form:

```javascript
// In your bot.js or enhanced-bot.js file
case '3': // Share a memory option
  await msg.reply("Share a story or memory for Olive's life story collection: https://yourusername.github.io/whatsapp-chatgpt-bot/#form");
  break;
```

### Step 9: Create a GitHub Actions Workflow

Create a file `.github/workflows/deploy.yml` to automate deployment:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          WASSENGER_API_KEY: ${{ secrets.WASSENGER_API_KEY }}
          WEBHOOK_URL: ${{ secrets.WEBHOOK_URL }}

      - name: Deploy to GitHub Pages
        uses: JamesIves/github-pages-deploy-action@4.1.4
        with:
          branch: gh-pages
          folder: docs
```

### Step 10: Monitor and Maintain

1. Check GitHub Actions to ensure your deployment is successful
2. Monitor your bot's performance
3. Update your code as needed and push changes to GitHub

## Alternative Free Hosting Options

### Railway

Railway offers a free tier that's perfect for hosting your WhatsApp bot:

1. Create a [Railway account](https://railway.app/)
2. Install the Railway CLI or use the web interface
3. Create a new project and deploy from your GitHub repository
4. Add the required environment variables in the Railway dashboard:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `WASSENGER_API_KEY`: Your Wassenger API key
   - `WEBHOOK_URL`: Your Railway service URL + "/webhook"
5. Railway will automatically deploy your application when you push changes

### Render

Render also offers a free tier for web services:

1. Create a [Render account](https://render.com/)
2. Connect your GitHub repository
3. Create a new Web Service
4. Configure the build and start commands
5. Add environment variables
6. Deploy your application

## Troubleshooting

- **Webhook not receiving messages**: Ensure your webhook URL is publicly accessible and correctly configured in Wassenger.
- **Bot not responding**: Check your logs for errors and ensure your API keys are correctly set.
- **Form not loading**: Verify the Tally form embed code is correct and the form is still active.

## Support

If you encounter any issues, please open an issue on the GitHub repository or contact the developer for assistance.
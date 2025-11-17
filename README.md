```markdown
# Branch Tracker

A modern web application for tracking Git branch merge status across different environments (Staging, UAT, Testing Operation, and Production). Built with Next.js 16 and integrated with Bitbucket API.

## Features

- 🔍 **Branch Search & Filter** - Search branches by name and filter by branch type (feature, bugfix, hotfix)
- 📊 **Merge Status Tracking** - Real-time tracking of merge status across multiple environments:
  - Staging
  - UAT
  - Testing Operation
  - Production (Master)
- 📈 **Summary Statistics** - Overview of branch distribution across environments
- 📄 **Pagination** - Efficient pagination for large branch lists
- 🎨 **Modern UI** - Beautiful, responsive interface built with Tailwind CSS
- ⚡ **Performance** - Optimized with React Query for efficient data fetching and caching

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **React**: 19.2.0
- **State Management**: TanStack React Query v5
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Date Formatting**: date-fns
- **HTTP Client**: Axios
- **Linting**: ESLint with Next.js config

## Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Bitbucket account with API access
- Bitbucket App Password (for API authentication)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd branch-tracker
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Create a `.env.local` file in the root directory:
```env
bitbucket_username=your_bitbucket_username
bitbucket_app_password=your_bitbucket_app_password
bitbucket_workspace=your_workspace_name
bitbucket_repo_slug=your_repository_slug
bitbucket_domain_api=https://api.bitbucket.org
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `bitbucket_username` | Your Bitbucket username | Yes | `your-username` |
| `bitbucket_app_password` | Bitbucket App Password | Yes | `xxxxxxxxxxxxxxxx` |
| `bitbucket_workspace` | Bitbucket workspace/organization name | Yes | `your_workspace_name` |
| `bitbucket_repo_slug` | Repository slug/name | Yes | `your_repository_slug` |
| `bitbucket_domain_api` | Bitbucket API domain | Yes | `https://api.bitbucket.org` |

**Example `.env.local`:**
```env
bitbucket_username=your-username
bitbucket_app_password=xxxxxxxxxxxxxxxx
bitbucket_workspace=your_workspace_name
bitbucket_repo_slug=your_repository_slug
bitbucket_domain_api=https://api.bitbucket.org
```

**Note**: 
- To create a Bitbucket App Password:
  1. Go to Bitbucket Settings → Personal settings → App passwords
  2. Create a new app password with repository read permissions
  3. Copy the generated password to `.env.local`
- For Bitbucket Server/Data Center, use your server's API domain instead of `https://api.bitbucket.org`
- The `bitbucket_workspace` is the workspace/organization name in your Bitbucket URL
- The `bitbucket_repo_slug` is the repository name in your Bitbucket URL

## Project Structure

```
branch-tracker/
├── app/
│   ├── api/
│   │   └── branches/
│   │       ├── route.js              # Main branches API endpoint
│   │       ├── merge-status/
│   │       │   └── route.js          # Check merge status
│   │       └── constant/
│   │           └── getBranchType/
│   │               └── route.js      # Get branch types
│   ├── components/
│   │   ├── branch-list/
│   │   │   └── index.js              # Branch list component
│   ├── hooks/
│   │   └── index.js                  # Custom hooks (useDebounce)
│   ├── layout.js                     # Root layout
│   ├── page.js                       # Main page
│   └── globals.css                   # Global styles
├── eslint.config.mjs                 # ESLint configuration
├── next.config.mjs                   # Next.js configuration
├── package.json
└── README.md
```

## API Endpoints

### GET `/api/branches`
Get paginated list of branches with merge status.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `size` (number): Items per page (default: 10)
- `name` (string): Search branch by name
- `branchType` (string): Filter by branch type (feature, bugfix, hotfix)

**Response:**
```json
{
  "data": [
    {
      "name": "feature/feat-123-description",
      "branchType": "feature",
      "authorName": "John Doe",
      "lastCommitDate": "2024-11-15T10:30:00Z",
      "mergeStatus": {
        "staging": true,
        "uat": true,
        "testing-operation": false,
        "master": false
      }
    }
  ],
  "totalPages": 10,
  "next": "/api/branches?page=2&size=10",
  "previous": null
}
```

### GET `/api/branches/merge-status`
Check merge status of a branch against target branches.

**Query Parameters:**
- `from` (string, required): Source branch name
- `to` (string, required): Target branch name (can be multiple)

**Example:**
```
GET /api/branches/merge-status?from=feature/feat-123&to=staging&to=uat&to=master
```

**Response:**
```json
{
  "from": "feature/feat-123",
  "mergeStatus": {
    "staging": {
      "merged": true,
      "remainingCommits": []
    },
    "uat": {
      "merged": false,
      "remainingCommits": [
        {
          "hash": "abc123",
          "message": "Commit message"
        }
      ]
    },
    "master": {
      "merged": false,
      "remainingCommits": []
    }
  }
}
```

### GET `/api/branches/constant/getBranchType`
Get list of unique branch types.

**Response:**
```json
{
  "data": ["feature", "bugfix", "hotfix"]
}
```

## Usage

### Search Branches
Use the search input to find branches by name or author. The search is debounced for better performance.

### Filter by Type
Select a branch type from the dropdown to filter branches:
- **All**: Show all branches
- **feature**: Show only feature branches
- **bugfix**: Show only bugfix branches
- **hotfix**: Show only hotfix branches

### View Merge Status
Each branch card displays:
- **Branch name and type**: Branch name with color-coded type badge
- **Author and last commit date**: Information about the branch creator and last update
- **Progress bar**: Visual indicator showing merge completion percentage
- **Merge status for each environment**: 
  - ✅ Green checkmark = Merged
  - ❌ Gray X = Not merged

### Pagination
- Navigate through pages using pagination controls
- Adjust items per page (10 or 20)
- Quick jump to specific page number
- Page information shows current page and total pages

## Scripts

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint to check code quality

## Configuration

### ESLint
ESLint is configured with Next.js recommended rules. Configuration can be found in `eslint.config.mjs`.

**Key rules:**
- 2-space indentation
- React best practices
- Next.js specific rules

### Next.js
React Compiler is enabled in `next.config.mjs` for optimized React rendering.

### Tailwind CSS
Tailwind CSS v4 is used for styling with PostCSS for processing.

## Development

### Code Style
- Use 2-space indentation
- Follow ESLint rules
- Use functional components with hooks
- Implement proper error handling

### Adding New Features
1. Create components in `app/components/`
2. Add API routes in `app/api/`
3. Use React Query for data fetching
4. Follow existing code patterns

## Troubleshooting

### API Authentication Errors
- Verify your `bitbucket_username` and `bitbucket_app_password` are correct
- Ensure the App Password has repository read permissions
- Check that the workspace and repo slug are correct

### No Branches Showing
- Verify `bitbucket_workspace` and `bitbucket_repo_slug` are correct
- Check that the repository exists and is accessible
- Verify API domain is correct (especially for Bitbucket Server)

### Build Errors
- Clear `.next` folder and rebuild
- Check Node.js version (requires 18+)
- Verify all dependencies are installed

## License

This project is private and proprietary.

## Support

For issues and questions, please open an issue in the repository.

---

Built with ❤️ using Next.js
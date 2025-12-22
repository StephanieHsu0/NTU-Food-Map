# Comment System Tests

This directory contains comprehensive tests for the comment system functionality.

## Test Structure

```
__tests__/
├── api/
│   └── comments/
│       ├── route.test.ts              # POST and GET /api/comments
│       └── [id]/
│           ├── route.test.ts          # GET, PUT, DELETE /api/comments/[id]
│           ├── like/
│           │   └── route.test.ts       # POST /api/comments/[id]/like
│           └── dislike/
│               └── route.test.ts       # POST /api/comments/[id]/dislike
├── components/
│   └── CommentSection.test.tsx         # UI component tests
├── integration/
│   └── comments.test.ts                # End-to-end integration tests
├── edge-cases/
│   └── comments.test.ts                # Edge case and error handling tests
└── utils/
    └── test-utils.tsx                   # Test utilities and helpers
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test -- route.test.ts
```

## Test Coverage

### API Route Tests
- ✅ POST /api/comments - Create comment with validation
- ✅ GET /api/comments - Fetch comments with sorting
- ✅ PUT /api/comments/[id] - Update comment with permission check
- ✅ DELETE /api/comments/[id] - Delete comment with permission check
- ✅ POST /api/comments/[id]/like - Like/unlike functionality
- ✅ POST /api/comments/[id]/dislike - Dislike/undislike functionality

### Component Tests
- ✅ CommentSection rendering
- ✅ Comment form display and submission
- ✅ Edit/delete functionality
- ✅ Like/dislike interactions
- ✅ Permission-based UI display
- ✅ Sorting functionality
- ✅ Rating display

### Integration Tests
- ✅ Complete comment lifecycle (create → edit → like → delete)
- ✅ Multi-user scenarios
- ✅ Sorting after operations

### Edge Case Tests
- ✅ Empty/null value handling
- ✅ Invalid ID handling
- ✅ Concurrent operations
- ✅ Database error handling
- ✅ Rating validation
- ✅ Large dataset performance

## Test Utilities

The `test-utils.tsx` file provides:
- `renderWithProviders` - Custom render function with SessionProvider and NextIntlClientProvider
- `mockSession` - Mock session data
- `createMockComment` - Helper to create mock comment objects
- `createMockUser` - Helper to create mock user objects

## Notes

- All tests use mocked database connections and authentication
- Tests are isolated and don't require a running database
- Mock data is reset between tests using `beforeEach` hooks
- Tests follow the AAA pattern (Arrange, Act, Assert)


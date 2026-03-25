import { moduleMetadata } from '@storybook/angular';
import { MockCometChatService } from '../utils/mock-services';

/**
 * Mock service decorator for Storybook stories.
 * 
 * This decorator provides mock implementations of CometChat SDK services,
 * allowing components to be rendered in Storybook without requiring actual
 * CometChat SDK initialization or authentication.
 * 
 * The decorator registers the MockCometChatService in Angular's dependency
 * injection system, making it available to all components in the story.
 * 
 * @example
 * // In preview.ts
 * export default {
 *   decorators: [withMockServices],
 * };
 * 
 * @example
 * // In a story file
 * export const Default: Story = {
 *   render: (args) => ({
 *     props: args,
 *     // The component will automatically receive the mock service
 *   }),
 * };
 */
export const withMockServices = (story: any, context: any) => {
  return moduleMetadata({
    providers: [
      MockCometChatService,
      // Provide the mock service for any service that might be injected
      {
        provide: 'CometChatService',
        useClass: MockCometChatService,
      },
    ],
  })(story, context);
};

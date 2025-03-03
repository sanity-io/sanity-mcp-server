import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSanityClient } from '../../src/utils/sanityClient.js';
import { portableTextToMarkdown } from '../../src/utils/portableText.js';
import { searchContent, subscribeToUpdates } from '../../src/controllers/content.js';
import config from '../../src/config/config.js';

// Mock the dependencies
vi.mock('../../src/utils/sanityClient.js');
vi.mock('../../src/utils/portableText.js');
vi.mock('../../src/config/config.js', () => ({
  default: {
    openAiApiKey: '',
    sanity: {
      projectId: 'test-project',
      dataset: 'test-dataset',
      apiVersion: '2023-01-01',
      token: 'test-token'
    }
  }
}));

describe('Content Controller', () => {
  // Mock client and its methods
  const mockClient = {
    fetch: vi.fn(),
    listen: vi.fn()
  };
  
  // Mock subscription
  const mockSubscription = {
    subscribe: vi.fn()
  };
  
  beforeEach(() => {
    // Setup mocks
    createSanityClient.mockReturnValue(mockClient);
    mockClient.fetch.mockResolvedValue([
      { _id: 'doc1', title: 'Document 1', body: 'Simple text' },
      { 
        _id: 'doc2', 
        title: 'Document 2', 
        body: [
          { _type: 'block', children: [{ _type: 'span', text: 'Portable Text' }] }
        ]
      }
    ]);
    
    mockClient.listen.mockReturnValue(mockSubscription);
    mockSubscription.subscribe.mockReturnValue({ unsubscribe: vi.fn() });
    
    portableTextToMarkdown.mockReturnValue('Converted Markdown');
    
    // Clear mock call history
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('searchContent', () => {
    it('should search for content using GROQ query', async () => {
      const query = '*[_type == "article"]';
      const params = { limit: 10 };
      
      const result = await searchContent('project123', 'dataset123', query, params);
      
      expect(createSanityClient).toHaveBeenCalledWith('project123', 'dataset123');
      expect(mockClient.fetch).toHaveBeenCalledWith(query, params);
      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({ _id: 'doc1', title: 'Document 1', body: 'Simple text' });
      
      // Check that Portable Text was processed
      expect(result.results[1].body).toEqual({
        _type: 'portableText',
        _markdown: 'Converted Markdown',
        _original: [{ _type: 'block', children: [{ _type: 'span', text: 'Portable Text' }] }]
      });
    });
    
    it('should handle empty results', async () => {
      mockClient.fetch.mockResolvedValueOnce([]);
      
      const result = await searchContent('project123', 'dataset123', '*[_type == "nonexistent"]');
      
      expect(result.results).toEqual([]);
    });
    
    it('should throw an error when fetch fails', async () => {
      mockClient.fetch.mockRejectedValueOnce(new Error('Fetch failed'));
      
      await expect(searchContent('project123', 'dataset123', '*')).rejects.toThrow('Failed to search content');
    });
    
    it('should throw an error when LLM verification is requested but API key not configured', async () => {
      // Ensure openAiApiKey is empty
      expect(config.openAiApiKey).toBe('');
      
      await expect(searchContent('project123', 'dataset123', '*', {}, true)).rejects.toThrow('LLM verification requested but OpenAI API key not configured');
    });
    
    it('should verify results with LLM when API key is configured', async () => {
      // Temporarily mock config to have an API key
      const originalConfig = { ...config };
      config.openAiApiKey = 'fake-key';
      
      try {
        const result = await searchContent('project123', 'dataset123', '*', {}, true);
        
        expect(result.verification).toBeDefined();
        expect(result.verification.performed).toBe(true);
        expect(result.verification.originalCount).toBe(2);
      } finally {
        // Restore original config
        Object.assign(config, originalConfig);
      }
    });
  });
  
  describe('subscribeToUpdates', () => {
    it('should create a subscription to document updates', async () => {
      const query = '*[_type == "article"]';
      
      const result = await subscribeToUpdates('project123', 'dataset123', query);
      
      expect(createSanityClient).toHaveBeenCalledWith('project123', 'dataset123');
      expect(mockClient.listen).toHaveBeenCalledWith(query);
      expect(mockSubscription.subscribe).toHaveBeenCalled();
      
      expect(result).toEqual(expect.objectContaining({
        subscriptionId: expect.any(String),
        query,
        message: expect.stringContaining('Subscription active')
      }));
    });
    
    it('should throw an error when subscription fails', async () => {
      mockClient.listen.mockImplementationOnce(() => {
        throw new Error('Subscription failed');
      });
      
      await expect(subscribeToUpdates('project123', 'dataset123', '*')).rejects.toThrow('Failed to subscribe to updates');
    });
    
    it('should handle subscription callbacks', async () => {
      // Spy on console.log
      const consoleSpy = vi.spyOn(console, 'log');
      
      // Simulate the callback being called with an update
      mockSubscription.subscribe.mockImplementationOnce((callback) => {
        callback({ 
          documentId: 'doc123', 
          type: 'update',
          result: { title: 'Updated Title' } 
        });
        return { unsubscribe: vi.fn() };
      });
      
      await subscribeToUpdates('project123', 'dataset123', '*');
      
      // Check that the update was logged (this is a stand-in for sending notifications)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Document update for subscription'),
        expect.objectContaining({
          documentId: 'doc123',
          type: 'update'
        })
      );
    });
  });
  
  describe('processPortableTextFields', () => {
    it('should process nested Portable Text fields', async () => {
      // Set up data with nested Portable Text
      mockClient.fetch.mockResolvedValueOnce([{
        _id: 'doc1',
        title: 'Nested Document',
        sections: [
          {
            heading: 'Section 1',
            content: [
              { _type: 'block', children: [{ _type: 'span', text: 'Nested Portable Text' }] }
            ]
          }
        ]
      }]);
      
      const result = await searchContent('project123', 'dataset123', '*');
      
      // Check that the nested Portable Text was processed
      expect(result.results[0].sections[0].content).toEqual({
        _type: 'portableText',
        _markdown: 'Converted Markdown',
        _original: [{ _type: 'block', children: [{ _type: 'span', text: 'Nested Portable Text' }] }]
      });
    });
  });
});

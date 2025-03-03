import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchContent, subscribeToUpdates, getGroqSpecification } from '../../src/controllers/groq.js';
import { portableTextToMarkdown } from '../../src/utils/portableText.js';
import config from '../../src/config/config.js';

// Mock the fetch function
global.fetch = vi.fn();

// Mock the dependencies
vi.mock('../../src/utils/sanityClient.js', () => ({
  createSanityClient: vi.fn(() => ({
    fetch: vi.fn(),
    listen: vi.fn()
  }))
}));

vi.mock('../../src/utils/portableText.js', () => ({
  portableTextToMarkdown: vi.fn()
}));

vi.mock('ws');

vi.mock('../../src/config/config.js', () => ({
  default: {
    openAiApiKey: '',
    sanityToken: 'test-token'
  }
}));

// Import the mocked modules
import { createSanityClient } from '../../src/utils/sanityClient.js';

describe('GROQ Controller', () => {
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
    // Reset all mocks
    vi.resetAllMocks();
    
    // Setup the mock client
    (createSanityClient as any).mockReturnValue(mockClient);
    
    // Set up the client.fetch mock to return test data
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
    
    // Set up the client.listen mock
    mockClient.listen.mockReturnValue(mockSubscription);
    mockSubscription.subscribe.mockReturnValue({ unsubscribe: vi.fn() });
    
    // Set up the portableTextToMarkdown mock
    (portableTextToMarkdown as any).mockReturnValue('Converted Markdown');
    
    // Set up the fetch mock for getGroqSpecification
    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('<html>GROQ Specification</html>')
    });
  });
  
  describe('searchContent', () => {
    it('should query content using GROQ with provided parameters', async () => {
      const query = '*[_type == "article"]';
      const params = { limit: 10 };
      
      const result = await searchContent('project123', 'dataset123', query, params);
      
      expect(createSanityClient).toHaveBeenCalledWith('project123', 'dataset123');
      expect(mockClient.fetch).toHaveBeenCalledWith(query, params);
      expect(result.results).toHaveLength(2);
    });
    
    it('should handle portable text fields', async () => {
      await searchContent('project123', 'dataset123', '*');
      
      expect(portableTextToMarkdown).toHaveBeenCalled();
    });
    
    it('should verify results with LLM when requested', async () => {
      // Temporarily set the openAiApiKey
      const originalConfig = { ...config };
      Object.assign(config, { openAiApiKey: 'test-key' });
      
      const result = await searchContent('project123', 'dataset123', '*', {}, true);
      
      expect(result.verification).toBeDefined();
      expect(result.verification?.performed).toBe(true);
      
      // Restore the original config
      Object.assign(config, originalConfig);
    });
    
    it('should handle errors when querying content', async () => {
      mockClient.fetch.mockRejectedValueOnce(new Error('GROQ syntax error'));
      
      await expect(searchContent('project123', 'dataset123', '*')).rejects.toThrow(
        'Failed to execute GROQ query: GROQ syntax error'
      );
    });
  });
  
  describe('subscribeToUpdates', () => {
    it('should create a subscription to document updates', async () => {
      const query = '*[_type == "article"]';
      
      const result = await subscribeToUpdates('project123', 'dataset123', query);
      
      expect(createSanityClient).toHaveBeenCalledWith('project123', 'dataset123');
      expect(mockClient.listen).toHaveBeenCalledWith(query);
      expect(mockSubscription.subscribe).toHaveBeenCalled();
      expect(result.subscriptionId).toBeDefined();
    });
    
    it('should handle errors when setting up subscription', async () => {
      mockClient.listen.mockImplementationOnce(() => {
        throw new Error('Connection error');
      });
      
      await expect(subscribeToUpdates('project123', 'dataset123', '*')).rejects.toThrow(
        'Failed to subscribe to updates: Connection error'
      );
    });
  });
  
  describe('getGroqSpecification', () => {
    it('should return the GROQ specification', async () => {
      const result = await getGroqSpecification();
      
      expect(global.fetch).toHaveBeenCalledWith("https://sanity-io.github.io/GROQ/");
      expect(result.specification).toBeDefined();
      expect(result.specification.name).toBe("GROQ");
      expect(result.specification.coreFeatures).toBeInstanceOf(Array);
      expect(result.specification.operators).toBeInstanceOf(Array);
      expect(result.source).toBe("https://sanity-io.github.io/GROQ/");
    });
    
    it('should handle errors when fetching GROQ specification', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });
      
      await expect(getGroqSpecification()).rejects.toThrow(
        'Failed to fetch GROQ specification, status: 404'
      );
    });
  });
});

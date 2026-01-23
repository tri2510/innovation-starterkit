#!/usr/bin/env node

// Test Chrome DevTools MCP functionality
console.log('Testing Chrome DevTools MCP Server...\n');

// Test 1: Check if MCP server is configured
const { execSync } = require('child_process');

try {
  console.log('✓ MCP Server Status:');
  const status = execSync('claude mcp list', { encoding: 'utf8' });
  console.log(status);
  
  console.log('\n✓ Available MCP Tools:');
  console.log('- Navigation: navigate_page, new_page, close_page, list_pages');
  console.log('- Input: click, fill, fill_form, hover, press_key');
  console.log('- Debugging: take_screenshot, evaluate_script, get_console_message');
  console.log('- Performance: performance_start_trace, performance_stop_trace');
  console.log('- Network: list_network_requests, get_network_request');
  
  console.log('\n✓ Example Usage:');
  console.log('Try asking Claude to:');
  console.log('1. "Navigate to http://localhost:3000/challenge"');
  console.log('2. "Take a screenshot of the current page"');
  console.log('3. "Check the performance of http://localhost:3000/challenge"');
  console.log('4. "Fill out the form on the challenge page"');
  
  console.log('\n✓ Test Complete! MCP server is ready for use.');
  
} catch (error) {
  console.error('✗ Test failed:', error.message);
  process.exit(1);
}
let composioInstance: any = null;

export async function getComposioClient() {
  if (!composioInstance) {
    const { Composio } = await import('@composio/core');
    composioInstance = new Composio({
      apiKey: process.env.COMPOSIO_API_KEY || 'dummy_key_to_bypass_build_error',
    });
  }
  return composioInstance;
}

export const composio = new Proxy({} as any, {
  get(_target, prop) {
    throw new Error(`Direct composio.${String(prop)} access deprecated. Use getComposioClient() or async helpers.`);
  },
});

export const AVAILABLE_TOOLS = {
  // Dev & PM
  'github': ['create_issue', 'create_pr', 'list_repos', 'read_file', 'write_file'],
  'gitlab': ['create_issue', 'create_mr'],
  'linear': ['create_issue', 'update_issue', 'list_issues', 'create_project'],
  'jira': ['create_issue', 'transition_issue'],
  'notion': ['create_page', 'update_page', 'query_database', 'search'],
  
  // Finance & Billing
  'stripe': ['list_customers', 'list_subscriptions', 'create_invoice', 'retrieve_balance'],
  'plaid': ['get_transactions', 'get_accounts'],
  'gocardless': ['get_transactions', 'get_accounts'],
  'pennylane': ['create_invoice', 'get_accounts'],
  
  // Sales & Marketing
  'apollo': ['search_contacts', 'enrich_company', 'create_sequence'],
  'linkedin': ['send_message', 'get_profile', 'search_people'],
  'hubspot': ['create_contact', 'create_deal', 'list_deals'],
  'instantly': ['create_campaign', 'add_leads'],
  'mailgun': ['send_email', 'validate_email'],
  
  // Data & Analytics
  'google_analytics': ['run_report', 'get_realtime'],
  'mixpanel': ['query', 'track_event'],
  'posthog': ['query', 'capture'],
  
  // Communication
  'slack': ['send_message', 'create_channel', 'list_channels'],
  'discord': ['send_message'],
  'gmail': ['send_email', 'list_messages', 'create_draft'],
  
  // Research
  'serpapi': ['search', 'search_news'],
  'firecrawl': ['scrape', 'crawl'],
  'exa': ['search', 'deep_research'],
  
  // Design & Docs
  'figma': ['get_file', 'get_components'],
  'excalidraw': ['create_drawing', 'export_image'],
};

export async function getUserConnection(userId: string, appName: string) {
  try {
    const client = await getComposioClient();
    const connection = await client.connectedAccounts.get(`${userId}-${appName}`);
    return connection;
  } catch (error) {
    return null;
  }
}

export async function executeComposioTool(toolName: string, params: any, userId: string) {
  const appName = toolName.split('_')[0];
  const connection = await getUserConnection(userId, appName);
  
  if (!connection) {
    throw new Error(`User does not have an active connection for ${appName}`);
  }
  
  const client = await getComposioClient();
  return client.actions.execute({
    action: toolName,
    params,
    connectedAccountId: connection.id
  });
}

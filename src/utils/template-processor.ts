/**
 * Utility to process templates by replacing placeholders with dynamic data.
 * Supports both {{placeholder}} and {placeholder} syntax for backward compatibility.
 */
export function processTemplate(content: string, payload: Record<string, any>): string {
    if (!content) return '';
    
    let processedContent = content;
    
    // Replace placeholders
    Object.entries(payload).forEach(([key, value]) => {
        // Support both {{key}} and {key} patterns
        const patterns = [
            new RegExp(`{{${key}}}`, 'g'),
            new RegExp(`{${key}}`, 'g')
        ];
        
        const stringValue = value !== undefined && value !== null ? String(value) : '';
        
        patterns.forEach(pattern => {
            processedContent = processedContent.replace(pattern, stringValue);
        });
    });
    
    return processedContent;
}

/**
 * Standard list of placeholders supported by the system
 */
export const STANDARD_PLACEHOLDERS = [
    'lead_name',
    'property_address',
    'agent_name',
    'office_name',
    'appointment_date',
    'appointment_time',
    'link',
    'message',
    'title'
];

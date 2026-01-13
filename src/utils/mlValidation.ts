// Machine Learning-based Input Validation System
// Advanced threat detection with pattern recognition

export interface ThreatPattern {
  pattern: string | RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'xss' | 'sql' | 'command' | 'path' | 'nosql' | 'zero-day';
  description: string;
}

export interface ThreatAnalysis {
  score: number; // 0-100
  threats: ThreatPattern[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
}

export interface ValidationRules {
  minLength?: number;
  maxLength?: number;
  allowedChars?: RegExp;
  forbiddenChars?: RegExp;
  allowEmpty?: boolean;
  trimWhitespace?: boolean;
  context: string;
}

// Advanced input validator with ML capabilities
export class AdvancedValidator {
  private static threatPatterns: ThreatPattern[] = [
    // XSS patterns
    { pattern: /<script[^>]*>.*?<\/script>/gi, severity: 'critical', category: 'xss', description: 'Script injection attempt' },
    { pattern: /javascript:/gi, severity: 'high', category: 'xss', description: 'JavaScript protocol injection' },
    { pattern: /on\w+\s*=\s*["']/gi, severity: 'high', category: 'xss', description: 'Event handler injection' },

    // SQL injection patterns  
    { pattern: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi, severity: 'critical', category: 'sql', description: 'SQL keyword detected' },
    { pattern: /(\b(OR|AND)\s+\w+\s*=\s*\w+)/gi, severity: 'high', category: 'sql', description: 'SQL condition injection' },
    { pattern: /--[\s\S]*$/gm, severity: 'medium', category: 'sql', description: 'SQL comment injection' },

    // Command injection patterns
    { pattern: /[;&|`$(){}[\]]/gi, severity: 'high', category: 'command', description: 'Command separator detected' },
    { pattern: /\$\([^)]+\)/gi, severity: 'medium', category: 'command', description: 'Command substitution' },

    // Path traversal patterns
    { pattern: /\.\.[\\/]/gi, severity: 'high', category: 'path', description: 'Path traversal attempt' },
    { pattern: /%2e%2e[\\/\\]/gi, severity: 'high', category: 'path', description: 'Encoded path traversal' },

    // NoSQL injection patterns
    { pattern: /(\$where|\$ne|\$gt|\$lt|\$in|\$nin)/gi, severity: 'high', category: 'nosql', description: 'NoSQL operator injection' },
    { pattern: /\{[^}]*\$[^}]+\}/gi, severity: 'medium', category: 'nosql', description: 'NoSQL template injection' },

    // Zero-day patterns (heuristics)
    { pattern: /[^\w\s]{20,}/gi, severity: 'medium', category: 'zero-day', description: 'Unusual character sequence' },
    { pattern: /(.)\1{3,}/gi, severity: 'low', category: 'zero-day', description: 'Repeated character pattern' },
    { pattern: /\b[a-zA-Z]{30,}\b/gi, severity: 'medium', category: 'zero-day', description: 'Unusually long word' }
  ];

  private static modelWeights = {
    xss: 0.9,
    sql: 1.0,
    command: 0.8,
    path: 0.85,
    nosql: 0.75,
    zeroDay: 0.6
  };

  private static threatHistory = new Map<string, number>();
  private static learningRate = 0.01;

  // Validate input with ML analysis
  static async validateInputAdvanced(input: string, rules: ValidationRules): Promise<ThreatAnalysis> {
    if (!input && !rules.allowEmpty) {
      return {
        score: 100,
        threats: [{
          pattern: /./,
          severity: 'critical',
          category: 'xss',
          description: 'Empty input not allowed'
        }],
        recommendations: ['Input is required'],
        riskLevel: 'critical',
        confidence: 100
      };
    }

    if (!input) {
      return {
        score: 0,
        threats: [],
        recommendations: [],
        riskLevel: 'low',
        confidence: 100
      };
    }

    const sanitizedInput = this.sanitizeInput(input, rules.context);
    const basicValidation = this.validateBasic(sanitizedInput, rules);

    // ML-based pattern detection
    const mlThreats = await this.detectThreatPatterns(sanitizedInput);

    // Behavioral analysis
    const behavioralThreats = this.analyzeInputBehavior(sanitizedInput, rules.context);

    // Combine all threats
    const allThreats = [...mlThreats, ...behavioralThreats];

    // Calculate composite score
    const compositeScore = this.calculateThreatScore(allThreats);

    // Generate recommendations
    const recommendations = this.generateRecommendations(allThreats, compositeScore);

    // Update learning model
    this.updateThreatHistory(allThreats);

    return {
      score: compositeScore,
      threats: allThreats,
      recommendations,
      riskLevel: this.getRiskLevel(compositeScore),
      confidence: this.calculateConfidence(allThreats)
    };
  }

  // Basic validation (existing logic)
  private static validateBasic(input: string, rules: ValidationRules): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let sanitized = input;

    // Length validation
    if (rules.minLength && sanitized.length < rules.minLength) {
      errors.push(`Minimum length is ${rules.minLength} characters`);
    }

    if (rules.maxLength && sanitized.length > rules.maxLength) {
      errors.push(`Maximum length is ${rules.maxLength} characters`);
    }

    // Character validation
    if (rules.allowedChars && !rules.allowedChars.test(sanitized)) {
      errors.push('Contains invalid characters');
    }

    if (rules.forbiddenChars && rules.forbiddenChars.test(sanitized)) {
      errors.push('Contains forbidden characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // ML-based threat pattern detection
  private static async detectThreatPatterns(input: string): Promise<ThreatPattern[]> {
    const detectedThreats: ThreatPattern[] = [];
    const normalizedInput = input.toLowerCase();

    for (const pattern of this.threatPatterns) {
      if ((pattern.pattern as any).test(normalizedInput)) {
        // Add weight based on historical data
        const historicalWeight = this.getHistoricalWeight(pattern);

        detectedThreats.push({
          pattern: (pattern.pattern as any).source || pattern.pattern.toString(),
          severity: this.adjustSeverity(pattern.severity, historicalWeight),
          category: pattern.category,
          description: pattern.description
        });
      }
    }

    // Detect new patterns using anomaly detection
    const anomalyThreats = this.detectAnomalies(input);
    detectedThreats.push(...anomalyThreats);

    return detectedThreats;
  }

  // Behavioral analysis
  private static analyzeInputBehavior(input: string, context: string): ThreatPattern[] {
    const threats: ThreatPattern[] = [];

    // Analyze input timing and patterns
    const timeBasedThreats = this.analyzeTimePatterns(input);
    threats.push(...timeBasedThreats);

    // Context-based analysis
    const contextThreats = this.analyzeContext(input, context);
    threats.push(...contextThreats);

    // Statistical analysis
    const statisticalThreats = this.analyzeStatistics(input);
    threats.push(...statisticalThreats);

    return threats;
  }

  // Detect anomalous patterns
  private static detectAnomalies(input: string): ThreatPattern[] {
    const anomalies: ThreatPattern[] = [];

    // Entropy analysis
    const entropy = this.calculateEntropy(input);
    if (entropy > 6.0) {
      anomalies.push({
        pattern: /./,
        severity: 'medium',
        category: 'zero-day',
        description: 'High entropy input detected'
      });
    }

    // Frequency analysis
    const frequencyThreats = this.analyzeFrequency(input);
    anomalies.push(...frequencyThreats);

    return anomalies;
  }

  // Time-based pattern analysis
  private static analyzeTimePatterns(input: string): ThreatPattern[] {
    const threats: ThreatPattern[] = [];

    // Simulate rapid input detection (bot-like behavior)
    if (input.length > 100) {
      const charRate = input.length / 5; // Assume 5 seconds input time
      if (charRate > 20) {
        threats.push({
          pattern: /./,
          severity: 'medium',
          category: 'zero-day',
          description: 'Rapid input detected'
        });
      }
    }

    return threats;
  }

  // Context-based analysis
  private static analyzeContext(input: string, context: string): ThreatPattern[] {
    const threats: ThreatPattern[] = [];

    // URL context checks
    if (context === 'url' && input.length > 2048) {
      threats.push({
        pattern: /./,
        severity: 'medium',
        category: 'zero-day',
        description: 'URL too long for context'
      });
    }

    // Password context checks
    if (context === 'password') {
      if (input === 'password' || input === '123456') {
        threats.push({
          pattern: /./,
          severity: 'high',
          category: 'zero-day',
          description: 'Common password detected'
        });
      }
    }

    return threats;
  }

  // Statistical analysis
  private static analyzeStatistics(input: string): ThreatPattern[] {
    const threats: ThreatPattern[] = [];

    // Character distribution analysis
    const distribution = this.calculateCharacterDistribution(input);
    const maxFrequency = Math.max(...Object.values(distribution));
    const totalChars = Object.values(distribution).reduce((a, b) => a + b, 0);

    if (maxFrequency / totalChars > 0.7) {
      threats.push({
        pattern: /./,
        severity: 'low',
        category: 'zero-day',
        description: 'Unusual character distribution'
      });
    }

    return threats;
  }

  // Calculate threat score
  private static calculateThreatScore(threats: ThreatPattern[]): number {
    if (threats.length === 0) return 0;

    let totalScore = 0;
    let maxSeverity = 0;

    for (const threat of threats) {
      const weight = this.modelWeights[threat.category === 'zero-day' ? 'zeroDay' : threat.category] || 0.5;
      let severityValue = 0;

      switch (threat.severity) {
        case 'critical': severityValue = 4; break;
        case 'high': severityValue = 3; break;
        case 'medium': severityValue = 2; break;
        case 'low': severityValue = 1; break;
      }

      maxSeverity = Math.max(maxSeverity, severityValue);
      totalScore += weight * severityValue;
    }

    // Apply compound factor (multiple threats)
    const compoundFactor = threats.length > 1 ? 1.2 : 1.0;

    return Math.min(100, totalScore * compoundFactor * 10);
  }

  // Generate recommendations
  private static generateRecommendations(threats: ThreatPattern[], score: number): string[] {
    const recommendations: string[] = [];
    const categories = new Set(threats.map(t => t.category));

    // Category-specific recommendations
    if (categories.has('xss')) {
      recommendations.push('Remove HTML/JavaScript content');
      recommendations.push('Use proper output encoding');
    }

    if (categories.has('sql')) {
      recommendations.push('Use parameterized queries');
      recommendations.push('Validate input against allowed values');
    }

    if (categories.has('command')) {
      recommendations.push('Avoid special shell characters');
      recommendations.push('Use input validation whitelist');
    }

    if (categories.has('path')) {
      recommendations.push('Validate file paths strictly');
      recommendations.push('Use canonical file paths');
    }

    // General recommendations based on score
    if (score > 70) {
      recommendations.push('HIGH RISK: Consider blocking this input');
    } else if (score > 40) {
      recommendations.push('MODERATE RISK: Additional validation required');
    }

    return recommendations;
  }

  // Update threat history (machine learning)
  private static updateThreatHistory(threats: ThreatPattern[]): void {
    for (const threat of threats) {
      const key = `${threat.category}:${threat.description}`;
      const currentWeight = this.threatHistory.get(key) || 0;
      this.threatHistory.set(key, currentWeight + this.learningRate);
    }
  }

  // Get historical weight for threat
  private static getHistoricalWeight(threat: ThreatPattern): number {
    const key = `${threat.category}:${threat.description}`;
    return this.threatHistory.get(key) || 1.0;
  }

  // Adjust severity based on historical data
  private static adjustSeverity(severity: 'low' | 'medium' | 'high' | 'critical', weight: number): 'low' | 'medium' | 'high' | 'critical' {
    if (weight > 1.5) {
      // Increase severity for frequently seen threats
      switch (severity) {
        case 'low': return 'medium';
        case 'medium': return 'high';
        case 'high': return 'critical';
        case 'critical': return 'critical';
      }
    }
    return severity;
  }

  // Calculate input entropy
  private static calculateEntropy(input: string): number {
    const charCounts: Map<string, number> = new Map();

    for (const char of input) {
      charCounts.set(char, (charCounts.get(char) || 0) + 1);
    }

    let entropy = 0;
    const length = input.length;

    for (const count of charCounts.values()) {
      const probability = count / length;
      entropy -= probability * Math.log2(probability);
    }

    return entropy;
  }

  // Calculate character frequency
  private static calculateCharacterDistribution(input: string): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const char of input) {
      distribution[char] = (distribution[char] || 0) + 1;
    }

    return distribution;
  }

  // Calculate confidence score
  private static calculateConfidence(threats: ThreatPattern[]): number {
    if (threats.length === 0) return 100;

    // Higher confidence with more detected patterns
    const baseConfidence = Math.min(95, threats.length * 15);

    // Adjust based on pattern severity
    const highSeverityCount = threats.filter(t =>
      t.severity === 'high' || t.severity === 'critical'
    ).length;

    const severityBonus = highSeverityCount * 5;

    return Math.min(100, baseConfidence + severityBonus);
  }

  // Get risk level from score
  private static getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  // Analyze frequency patterns
  private static analyzeFrequency(input: string): ThreatPattern[] {
    const threats: ThreatPattern[] = [];
    const charCount = input.length;

    // Check for excessive repetition
    const repeats = input.match(/(.)\1{5,}/g);
    if (repeats && repeats.length > 0) {
      threats.push({
        pattern: repeats[0],
        severity: 'medium',
        category: 'zero-day',
        description: 'Excessive character repetition'
      });
    }

    return threats;
  }

  // Sanitize input with context awareness
  private static sanitizeInput(input: string, context: string): string {
    let sanitized = input;

    // Remove null bytes and control characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Context-specific sanitization
    switch (context) {
      case 'url':
        sanitized = sanitized.replace(/[\s<>"{}|\\^`]/g, '');
        sanitized = sanitized.replace(/^(javascript|data|vbscript):/i, '');
        break;

      case 'email':
        sanitized = sanitized.toLowerCase();
        sanitized = sanitized.replace(/[<>{}[\]]/g, '');
        sanitized = sanitized.replace(/\s+/g, '');
        break;

      case 'filename':
        sanitized = sanitized.replace(/[<>:"|?*\\\/]/g, '');
        sanitized = sanitized.replace(/\.\.[\\/]/g, '');
        sanitized = sanitized.substring(0, 255);
        break;

      default:
        // General text sanitization
        sanitized = sanitized.replace(/<[^>]*>/g, '');
        sanitized = sanitized.replace(/on\w+\s*=/gi, '');
        sanitized = sanitized.replace(/[<>{}[\]]/g, '');
        break;
    }

    return sanitized;
  }

  // Validate specific field types with ML
  static async validateWithML(input: string, context: string, customRules?: Partial<ValidationRules>): Promise<ThreatAnalysis> {
    const rules: ValidationRules = {
      minLength: customRules?.minLength || 1,
      maxLength: customRules?.maxLength || 2048,
      allowEmpty: customRules?.allowEmpty || false,
      trimWhitespace: customRules?.trimWhitespace !== false,
      context: context
    };

    return await this.validateInputAdvanced(input, rules);
  }

  // Get threat statistics
  static getThreatStatistics(): {
    totalThreats: number;
    threatsByCategory: Record<string, number>;
    averageWeight: number;
  } {
    const threatsByCategory: Record<string, number> = {};
    let totalWeight = 0;
    let count = 0;

    for (const [key, weight] of this.threatHistory.entries()) {
      const [category] = key.split(':');
      threatsByCategory[category] = (threatsByCategory[category] || 0) + 1;
      totalWeight += weight;
      count++;
    }

    return {
      totalThreats: count,
      threatsByCategory,
      averageWeight: count > 0 ? totalWeight / count : 0
    };
  }

  // Reset learning model
  static resetLearningModel(): void {
    this.threatHistory.clear();
    console.log('ML threat detection model reset');
  }
}
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X, ArrowRight, Info } from 'lucide-react';

export default function SkillFilterDebug({ gapAnalysis }) {
  if (!gapAnalysis?.filteredOut) {
    return null;
  }

  const { filteredOut } = gapAnalysis;
  const hasFilteredContent = 
    filteredOut.missing?.length > 0 || 
    filteredOut.advance?.length > 0 || 
    filteredOut.mapped?.length > 0;

  if (!hasFilteredContent) {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600" />
          Skill Filtering Results
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          AI automatically filtered out non-learnable items and converted vague terms to specific skills
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtered Out Skills */}
        {filteredOut.missing?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-2">
              <X className="h-4 w-4" />
              Filtered Out (Non-learnable)
            </h4>
            <div className="space-y-2">
              {filteredOut.missing.map((filtered, index) => (
                <div key={index} className="text-xs">
                  <Badge variant="outline" className="text-red-600 border-red-200">
                    {filtered.original}
                  </Badge>
                  <span className="text-muted-foreground ml-2">
                    - {filtered.reason}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mapped Skills */}
        {filteredOut.mapped?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Converted to Specific Skills
            </h4>
            <div className="space-y-2">
              {filteredOut.mapped.map((mapping, index) => (
                <div key={index} className="text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      {mapping.original}
                    </Badge>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="ml-4 flex flex-wrap gap-1">
                    {mapping.mappedTo.map((skill, skillIndex) => (
                      <Badge key={skillIndex} variant="secondary" className="text-green-600">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Final Learnable Skills */}
        <div>
          <h4 className="text-sm font-medium text-blue-600 mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Final Learnable Skills ({gapAnalysis.missingSkills?.length || 0} missing, {gapAnalysis.skillsToAdvance?.length || 0} to advance)
          </h4>
          <div className="flex flex-wrap gap-1">
            {gapAnalysis.missingSkills?.map((skill, index) => (
              <Badge key={index} variant="destructive" className="text-xs">
                {skill}
              </Badge>
            ))}
            {gapAnalysis.skillsToAdvance?.map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
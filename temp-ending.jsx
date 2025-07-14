      {/* Job Application Dialog */}
      <JobApplicationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        job={selectedJob}
        onApplicationSubmitted={handleApplicationSubmitted}
      />
    </div>
  );
}

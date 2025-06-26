import { NextResponse } from 'next/server';
import clientPromise, { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PATCH(request) {
    try {
        const db = await getDatabase();
        const body = await request.json();
        
        const { 
            applicationId, 
            interviewDate, 
            interviewTime, 
            interviewType, 
            interviewNotes,
            interviewLocation,
            interviewLink 
        } = body;

        if (!applicationId) {
            return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
        }

        // Prepare update data
        const updateData = {
            interviewDate: interviewDate ? new Date(interviewDate) : null,
            interviewTime: interviewTime || null,
            interviewType: interviewType || 'Technical Interview',
            interviewNotes: interviewNotes || '',
            interviewLocation: interviewLocation || '',
            interviewLink: interviewLink || '',
            updatedAt: new Date()
        };

        // Remove null values
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === null || updateData[key] === '') {
                delete updateData[key];
            }
        });

        // Update the application with interview details
        const result = await db.collection('applications').updateOne(
            { _id: new ObjectId(applicationId) },
            { 
                $set: updateData,
                $setOnInsert: { createdAt: new Date() }
            },
            { upsert: false }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        // Get the updated application
        const updatedApplication = await db.collection('applications').findOne(
            { _id: new ObjectId(applicationId) }
        );

        return NextResponse.json({
            success: true,
            message: 'Interview scheduled successfully',
            application: updatedApplication
        });

    } catch (error) {
        console.error('Error scheduling interview:', error);
        return NextResponse.json({ 
            error: 'Failed to schedule interview',
            details: error.message 
        }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        const db = await getDatabase();
        const { searchParams } = new URL(request.url);
        const applicationId = searchParams.get('applicationId');

        if (!applicationId) {
            return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
        }

        // Get interview details for the application
        const application = await db.collection('applications').findOne(
            { _id: new ObjectId(applicationId) }
        );

        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            interview: {
                applicationId: application._id,
                interviewDate: application.interviewDate,
                interviewTime: application.interviewTime,
                interviewType: application.interviewType,
                interviewNotes: application.interviewNotes,
                interviewLocation: application.interviewLocation,
                interviewLink: application.interviewLink,
                applicantName: application.applicantName,
                applicantEmail: application.applicantEmail,
                status: application.applicationStatus
            }
        });

    } catch (error) {
        console.error('Error fetching interview details:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch interview details',
            details: error.message 
        }, { status: 500 });
    }
}

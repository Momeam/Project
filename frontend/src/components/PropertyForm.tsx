'use client';

import React from 'react';
import AddListingForm from './AddListingForm';
import { Property } from '@/lib/types';

interface PropertyFormProps {
    property?: Property;
    isEdit?: boolean;
}

export function PropertyForm({ property, isEdit = false }: PropertyFormProps) {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AddListingForm property={property} isEdit={isEdit} />
        </div>
    );
}
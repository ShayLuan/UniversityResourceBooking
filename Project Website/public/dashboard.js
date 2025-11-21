document.getElementById('manage-resource-link').addEventListener('click', function (event) {
    event.preventDefault(); // don't want the event to do its normal thing
    document.getElementById('edit-tools').style.display = "block";
});

document.getElementById('add-resource-button').addEventListener('click', function (event) {
    document.getElementById('add-resource-selector').style.display = "block";
    // reset form
    document.getElementById('add-resource-selector').value = "";
    document.getElementById('resource-name-input').value = "";
    document.getElementById('resource-name-container').style.display = "none";
    document.getElementById('add-resource-confirm-button').style.display = "none";
});

document.getElementById('back-button').addEventListener('click', function (event) {
    document.getElementById('edit-tools').style.display = "none";
});

document.getElementById('resourceSelect').addEventListener('change', async function (event) {
    const selectedResource = this.value;
    const operationSelect = document.getElementById('operation-selector');
    
    if (selectedResource) {
        operationSelect.style.display = "block";
        
        // check if resource is suspended
        try {
            const response = await fetch('/api/resources', { credentials: 'include' });
            if (response.ok) {
                const resources = await response.json();
                const resource = resources.find(r => r.name === selectedResource);
                
                // update suspend option text
                const suspendOption = operationSelect.querySelector('option[value="suspend"]');
                if (suspendOption) {
                    if (resource && resource.suspended) {
                        suspendOption.textContent = 'Resume';
                    } else {
                        suspendOption.textContent = 'Suspend';
                    }
                }
            }
        } catch (err) {
            console.error("Error checking resource status:", err);
        }
    } else {
        operationSelect.style.display = "none";
        const suspendOption = operationSelect.querySelector('option[value="suspend"]');
        if (suspendOption) {
            suspendOption.textContent = 'Suspend';
        }
    }
});

// Container for duplicate name input
let duplicateNameContainer = null;

document.getElementById('operation-selector').addEventListener('change', function (event) {
    const operation = this.value;
    const confirmButton = document.getElementById('confirm-changes');
    
    // remove any existing duplicate name input
    if (duplicateNameContainer) {
        duplicateNameContainer.remove();
        duplicateNameContainer = null;
    }
    
    if (operation) {
        if (operation === 'duplicate') {
            // show input field for duplicate name
            const operationDiv = this.parentElement;
            duplicateNameContainer = document.createElement('div');
            duplicateNameContainer.id = 'duplicate-name-container';
            duplicateNameContainer.style.marginTop = '12px';
            duplicateNameContainer.innerHTML = `
                <label for="duplicate-name-input" style="display: block; margin-bottom: 8px; font-weight: 600; color: #132a13;">
                    New Resource Name:
                </label>
                <input 
                    type="text" 
                    id="duplicate-name-input" 
                    class="resource-formgroup" 
                    placeholder="Enter name for duplicate (e.g., Study Room D)"
                    style="width: 100%; max-width: 400px;"
                />
            `;
            operationDiv.appendChild(duplicateNameContainer);
            
            // enable confirm button
            confirmButton.style.display = "none";
            
            // listen for input
            setTimeout(() => {
                const duplicateInput = document.getElementById('duplicate-name-input');
                if (duplicateInput) {
                    duplicateInput.addEventListener('input', function() {
                        if (this.value.trim()) {
                            confirmButton.style.display = "flex";
                        } else {
                            confirmButton.style.display = "none";
                        }
                    });
                }
            }, 100);
        } else {
            // for delete/suspend, show button immediately
            confirmButton.style.display = "flex";
        }
    } else {
        confirmButton.style.display = "none";
    }
});

// map values to database values
const categoryMap = {
    'study-room': 'Study Room',
    'computer-lab': 'Computer Lab',
    'gym-sports': 'Sports Facility',
    'event-space': 'Event Space',
    'library-resource': 'Library Resource'
};

document.getElementById('add-resource-selector').addEventListener('change', function (event) {
    if (this.value) {
        document.getElementById('resource-name-container').style.display = "block";
        document.getElementById('add-resource-confirm-button').style.display = "none"; 
    } else {
        document.getElementById('resource-name-container').style.display = "none";
        document.getElementById('add-resource-confirm-button').style.display = "none";
    }
});

// enable confirm button when name is entered
const resourceNameInput = document.getElementById('resource-name-input');
if (resourceNameInput) {
    resourceNameInput.addEventListener('input', function (event) {
        const nameInput = this.value.trim();
        const confirmButton = document.getElementById('add-resource-confirm-button');
        if (nameInput && document.getElementById('add-resource-selector').value) {
            confirmButton.style.display = "flex";
        } else {
            confirmButton.style.display = "none";
        }
    });
}

// handle confirm add resource
document.getElementById('add-resource-confirm-button').addEventListener('click', async function (event) {
    const categorySelect = document.getElementById('add-resource-selector');
    const nameInput = document.getElementById('resource-name-input');
    const category = categorySelect.value;
    const name = nameInput.value.trim();
    
    if (!name) {
        alert("Please enter a resource name");
        return;
    }
    
    if (!category) {
        alert("Please select a resource type");
        return;
    }
    
    // Disable button during submission
    this.disabled = true;
    this.textContent = "Adding...";
    
    try {
        const response = await fetch('/api/resources', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                name: name,
                category: categoryMap[category],
                description: null,
                location: null,
                capacity: null
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.ok) {
            alert(`Resource "${name}" added successfully!`);
            
            // reset form
            categorySelect.value = "";
            nameInput.value = "";
            document.getElementById('resource-name-container').style.display = "none";
            categorySelect.style.display = "none";
            this.style.display = "none";
            this.disabled = false;
            this.textContent = "Confirm Add Resource";
            
            // reload resources in the selector dropdown
            await loadResourcesIntoSelector();
        } else {
            alert(`Failed to add resource: ${data.error || 'Unknown error'}`);
            this.disabled = false;
            this.textContent = "Confirm Add Resource";
        }
    } catch (err) {
        console.error("Error adding resource:", err);
        alert("Error adding resource. Please try again.");
        this.disabled = false;
        this.textContent = "Confirm Add Resource";
    }
});

// load resources
async function loadResourcesIntoSelector() {
    try {
        const response = await fetch('/api/resources', { credentials: 'include' });
        if (!response.ok) {
            console.error("Failed to load resources");
            return;
        }
        
        const resources = await response.json();
        const resourceSelect = document.getElementById('resourceSelect');
        
        // clear existing options except the first one
        resourceSelect.innerHTML = '<option value="" disabled selected>Select Resource</option>';
        
        // group resources by category
        const grouped = {};
        resources.forEach(r => {
            if (!grouped[r.category]) {
                grouped[r.category] = [];
            }
            grouped[r.category].push(r);
        });
        
        // add resources grouped by category
        Object.keys(grouped).sort().forEach(category => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = category;
            
            grouped[category].forEach(resource => {
                const option = document.createElement('option');
                option.value = resource.name;
                option.textContent = resource.name;
                
                // grey out suspended resources
                if (resource.suspended) {
                    option.style.color = '#999';
                    option.style.fontStyle = 'italic';
                    option.textContent += ' (Suspended)';
                    option.disabled = false; // still ok for admin
                }
                
                optgroup.appendChild(option);
            });
            
            resourceSelect.appendChild(optgroup);
        });
    } catch (err) {
        console.error("Error loading resources:", err);
    }
}

// handle confirm changes button
document.getElementById('confirm-changes').addEventListener('click', async function() {
    const resourceSelect = document.getElementById('resourceSelect');
    const operationSelect = document.getElementById('operation-selector');
    const selectedResource = resourceSelect.value;
    const operation = operationSelect.value;
    
    if (!selectedResource) {
        alert("Please select a resource");
        return;
    }
    
    if (!operation) {
        alert("Please select an operation");
        return;
    }
    
    // disable button during operation
    this.disabled = true;
    const originalText = this.textContent;
    this.textContent = "Processing...";
    
    try {
        let response;
        let data;
        
        if (operation === 'delete') {
            // Confirm deletion
            if (!confirm(`Are you sure you want to delete "${selectedResource}"? This action cannot be undone.`)) {
                this.disabled = false;
                this.textContent = originalText;
                return;
            }
            
            response = await fetch(`/api/resources/${encodeURIComponent(selectedResource)}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            data = await response.json();
            
            if (response.ok && data.ok) {
                alert(`Resource "${selectedResource}" deleted successfully!`);
                // reset
                resourceSelect.value = "";
                operationSelect.value = "";
                operationSelect.style.display = "none";
                this.style.display = "none";
                // reload
                await loadResourcesIntoSelector();
            } else {
                alert(`Failed to delete resource: ${data.error || 'Unknown error'}`);
            }
            
        } else if (operation === 'suspend') {
            // check suspend status
            const resources = await fetch('/api/resources', { credentials: 'include' }).then(r => r.json());
            const resource = resources.find(r => r.name === selectedResource);
            const isCurrentlySuspended = resource && resource.suspended;
            
            response = await fetch(`/api/resources/${encodeURIComponent(selectedResource)}/suspend`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    suspended: !isCurrentlySuspended
                })
            });
            data = await response.json();
            
            if (response.ok && data.ok) {
                alert(`Resource "${selectedResource}" ${!isCurrentlySuspended ? 'suspended' : 'resumed'} successfully!`);
                // reset
                resourceSelect.value = "";
                operationSelect.value = "";
                operationSelect.style.display = "none";
                this.style.display = "none";
                if (duplicateNameContainer) {
                    duplicateNameContainer.remove();
                    duplicateNameContainer = null;
                }
                // reload
                await loadResourcesIntoSelector();
            } else {
                alert(`Failed to ${!isCurrentlySuspended ? 'suspend' : 'resume'} resource: ${data.error || 'Unknown error'}`);
            }
            
        } else if (operation === 'duplicate') {
            const duplicateInput = document.getElementById('duplicate-name-input');
            const newName = duplicateInput ? duplicateInput.value.trim() : "";
            
            if (!newName) {
                alert("Please enter a name for the duplicate resource");
                this.disabled = false;
                this.textContent = originalText;
                return;
            }
            
            response = await fetch(`/api/resources/${encodeURIComponent(selectedResource)}/duplicate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    newName: newName
                })
            });
            data = await response.json();
            
            if (response.ok && data.ok) {
                alert(`Resource "${selectedResource}" duplicated as "${newName}" successfully!`);
                // reset
                resourceSelect.value = "";
                operationSelect.value = "";
                operationSelect.style.display = "none";
                this.style.display = "none";
                if (duplicateNameContainer) {
                    duplicateNameContainer.remove();
                    duplicateNameContainer = null;
                }
                // reload
                await loadResourcesIntoSelector();
            } else {
                alert(`Failed to duplicate resource: ${data.error || 'Unknown error'}`);
            }
        }
        
    } catch (err) {
        console.error("Error performing operation:", err);
        alert(`Error performing ${operation} operation. Please try again.`);
    } finally {
        this.disabled = false;
        this.textContent = originalText;
    }
});

// Load resources when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadResourcesIntoSelector();
});

document.getElementById('analyticsCard').addEventListener('click', function () {
    window.open('analytics.html', '_blank', 'width=900,height=600');
});

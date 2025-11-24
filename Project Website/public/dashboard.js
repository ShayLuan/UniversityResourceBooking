document.getElementById('manage-resource-link').addEventListener('click', function (event) {
    event.preventDefault(); // don't want the event to do its normal thing
    document.getElementById('edit-tools').style.display = "block";
});

// update suspend all button state
async function updateSuspendAllButton() {
    const button = document.getElementById('suspend-all-button');
    if (!button) return;
    
    try {
        const response = await fetch('/api/resources', { credentials: 'include' });
        if (!response.ok) return;
        
        const resources = await response.json();
        const allSuspended = resources.length > 0 && resources.every(r => r.suspended);
        
        if (allSuspended) {
            button.textContent = "Resume All Resources";
            button.style.backgroundColor = "#386641";
        } else {
            button.textContent = "Suspend All Resources";
            button.style.backgroundColor = "#c1121f";
        }
    } catch (err) {
        console.error("Error checking resource status:", err);
    }
}

document.getElementById('suspend-all-button').addEventListener('click', async function (event) {
    // check current state
    const isResumeMode = this.textContent.includes("Resume");
    
    // show confirmation message
    const confirmation = confirm(
        isResumeMode 
            ? "Are you sure you want to resume ALL resources? This will make all resources available for booking."
            : "Are you sure you want to suspend ALL resources? This will make ALL resources unavailable for booking."
    );
    
    if (!confirmation) {
        return;
    }
    
    // disable button during operation
    this.disabled = true;
    const originalText = this.textContent;
    this.textContent = isResumeMode ? "Resuming..." : "Suspending...";
    
    try {
        const response = await fetch('/api/resources', { credentials: 'include' });
        if (!response.ok) {
            alert("Failed to load resources");
            this.disabled = false;
            this.textContent = originalText;
            return;
        }
        
        const resources = await response.json();
        const targetResources = isResumeMode 
            ? resources.filter(r => r.suspended)
            : resources.filter(r => !r.suspended);
        
        if (targetResources.length === 0) {
            alert(isResumeMode 
                ? "All resources are already resumed."
                : "All resources are already suspended.");
            this.disabled = false;
            this.textContent = originalText;
            return;
        }
        
        let successCount = 0;
        let failCount = 0;
        
        for (const resource of targetResources) {
            try {
                const suspendResponse = await fetch(`/api/resources/${encodeURIComponent(resource.name)}/suspend`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        suspended: !isResumeMode
                    })
                });
                
                const suspendData = await suspendResponse.json();
                if (suspendResponse.ok && suspendData.ok) {
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (err) {
                console.error(`Error ${isResumeMode ? 'resuming' : 'suspending'} ${resource.name}:`, err);
                failCount++;
            }
        }
        
        // show result
        if (failCount === 0) {
            alert(`Successfully ${isResumeMode ? 'resumed' : 'suspended'} ${successCount} resource(s)!`);
            // reload resources and update button
            await loadResourcesIntoSelector();
            await updateSuspendAllButton();
        } else {
            alert(`${isResumeMode ? 'Resumed' : 'Suspended'} ${successCount} resource(s), but ${failCount} failed.`);
        }
        
    } catch (err) {
        console.error(`Error ${isResumeMode ? 'resuming' : 'suspending'} all resources:`, err);
        alert(`Error ${isResumeMode ? 'resuming' : 'suspending'} resources. Please try again.`);
    } finally {
        this.disabled = false;
        await updateSuspendAllButton();
    }
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
            await updateSuspendAllButton();
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
                await updateSuspendAllButton();
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

// Verify if user is an admin
// async function checkRoles(role) {
//     try {
//         const response = await fetch('/api/user', { credentials: 'include'});

//         if (!response.ok) {
//             window.location.href = '/Login.html?error=unauthorized';
//             return null;
//         }

//         const user = await res.json();

//         if (user.role !== role) {
//             window.location.href = '/Login.html?error=unauthorized';
//             return null;
//         }
//     } catch (err) {
//         console.error('Error checking session: ', err);
//         window.location.href = '/Login.html?error=unauthorized';
//         return null;
//     }
// }

// Load resources when page loads
document.addEventListener('DOMContentLoaded', async () => {
    // const user = await checkRoles("admin");
    // if (!user) return;

    loadResourcesIntoSelector();
    updateSuspendAllButton();
});

document.getElementById('analyticsCard').addEventListener('click', function () {
    window.open('analytics.html', '_blank', 'width=900,height=600');
});

// making announcements
document.getElementById('announcementLink').addEventListener('click', function (event) {
    event.preventDefault();
    const modal = document.getElementById('announcement-modal');
    const textarea = document.getElementById('announcement-text');
    const charCount = document.getElementById('char-count');
    
    modal.style.display = 'flex';
    textarea.value = '';
    charCount.textContent = '0';
    textarea.focus();
});

// close the thing when i click outside
document.getElementById('announcement-modal').addEventListener('click', function (event) {
    if (event.target === this) {
        this.style.display = 'none';
    }
});

document.getElementById('cancel-announcement-btn').addEventListener('click', function () {
    const modal = document.getElementById('announcement-modal');
    modal.style.display = 'none';
});

// max characters just double the tweet lol
document.getElementById('announcement-text').addEventListener('input', function () {
    const charCount = document.getElementById('char-count');
    charCount.textContent = this.value.length;
    
    // approaching limit and change color
    if (this.value.length > 270) {
        charCount.style.color = '#c1121f';
    } else {
        charCount.style.color = '#132a13';
    }
});

// send announcement
document.getElementById('send-announcement-btn').addEventListener('click', async function () {
    const textarea = document.getElementById('announcement-text');
    const message = textarea.value.trim();
    
    if (!message) {
        alert("Please enter an announcement message.");
        return;
    }
    
    if (message.length > 300) {
        alert("Message exceeds 300 characters.");
        return;
    }
    
    // Disable button during submission
    this.disabled = true;
    this.textContent = "Sending...";
    
    try {
        const response = await fetch('/api/announcements', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                message: message
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.ok) {
            alert(`Announcement sent successfully to all students and faculty members!`);
        } else {
            alert(`Failed to send announcement: ${data.error || 'Unknown error'}`);
            this.disabled = false;
            this.textContent = "Send";
            return;
        }
        
        // close and reset
        document.getElementById('announcement-modal').style.display = 'none';
        textarea.value = '';
        document.getElementById('char-count').textContent = '0';
        
    } catch (err) {
        console.error("Error sending announcement:", err);
        alert("Error sending announcement. Please try again.");
    } finally {
        this.disabled = false;
        this.textContent = "Send";
    }
});

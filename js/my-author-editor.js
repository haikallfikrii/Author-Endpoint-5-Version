jQuery(document).ready(function($) {
    // Media Uploader for Author Photo
    var authorImageUploader;

    $(document).on('click', '.browse-author-image', function(e) {
        e.preventDefault();

        // If the uploader already exists, open it
        if (authorImageUploader) {
            authorImageUploader.open();
            return;
        }

        // Create the WordPress media frame
        authorImageUploader = wp.media({
            title: 'Choose Author Photo',
            button: {
                text: 'Select Photo'
            },
            multiple: false // Set to true if you want to allow multiple selections
        });

        // When a file is selected, grab the URL and ID and set it to the input fields
        authorImageUploader.on('select', function() {
            var attachment = authorImageUploader.state().get('selection').first().toJSON();
            $('#author_photo_id').val(attachment.id);
            $('#author_photo_url').val(attachment.url);
            $('#author-image-preview img').attr('src', attachment.url);
            $('#author-image-preview').show();
        });

        // Open the uploader dialog
        authorImageUploader.open();
    });

    // Handle "Remove Image" button click for Author Photo
    $(document).on('click', '.remove-author-image', function(e) {
        e.preventDefault();
        $('#author_photo_id').val('');
        $('#author_photo_url').val('');
        $('#author-image-preview img').attr('src', '');
        $('#author-image-preview').hide();
    });

    // AJAX to load author content
    $('#load-author-content-btn').on('click', function(e) {
        e.preventDefault();
        var authorId = $('#selected_author_id').val();

        if (authorId) {
            $.ajax({
                url: myAuthorEditorAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'my_author_editor_get_author_content',
                    author_id: authorId,
                    nonce: myAuthorEditorAjax.nonce
                },
                beforeSend: function() {
                    $('#author-editor-form').find('input, select, button, textarea').prop('disabled', true);
                    $('#load-author-content-btn').text('Loading...');
                },
                success: function(response) {
                    if (response.success) {
                        var data = response.data;
                        $('#author_post_id').val(data.author_post_id);
                        // Do NOT change #new_author_name as per your layout request, only subtitle and content
                        // $('#new_author_name').val(data.author_name); // Keep this commented to avoid changing the "Add an author" field
                        $('#author_subtitle').val(data.author_subtitle);

                        // Set TinyMCE content
                        if (tinymce.get('author_content')) {
                            tinymce.get('author_content').setContent(data.author_content);
                        } else {
                            $('#author_content').val(data.author_content); // Fallback for non-TinyMCE
                        }

                        // Author Photo
                        if (data.author_photo_id && data.author_photo_url) {
                            $('#author_photo_id').val(data.author_photo_id);
                            $('#author_photo_url').val(data.author_photo_url);
                            $('#author-image-preview img').attr('src', data.author_photo_url);
                            $('#author-image-preview').show();
                        } else {
                            $('#author_photo_id').val('');
                            $('#author_photo_url').val('');
                            $('#author-image-preview img').attr('src', '');
                            $('#author-image-preview').hide();
                        }

                        // Footer Position and Insert Link
                        $('#footer_position').val(data.footer_position);
                        $('#insert_link').val(data.insert_link);

                        // Display message if no content found but author selected
                        if (data.author_post_id === 0 && data.message) {
                             // You can choose to display this message to the user in a dedicated div
                             // For now, let's just log it or handle it silently
                             console.log(data.message);
                        }

                    } else {
                        alert(response.data.message || 'Error loading author content.');
                        // Reset fields on error
                        $('#author_post_id').val('0');
                        // $('#new_author_name').val(''); // Keep commented
                        $('#author_subtitle').val('');
                        if (tinymce.get('author_content')) {
                            tinymce.get('author_content').setContent('');
                        } else {
                            $('#author_content').val('');
                        }
                        $('#author_photo_id').val('');
                        $('#author_photo_url').val('');
                        $('#author-image-preview img').attr('src', '');
                        $('#author-image-preview').hide();
                        $('#footer_position').val('');
                        $('#insert_link').val('');
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    alert('AJAX Error: ' + textStatus + ' - ' + errorThrown);
                    console.log(jqXHR.responseText); // Log full error response for debugging
                },
                complete: function() {
                    $('#author-editor-form').find('input, select, button, textarea').prop('disabled', false);
                    $('#load-author-content-btn').text('Submit');
                }
            });
        } else {
            alert(myAuthorEditorAjax.alert_no_author_selected);
            // Clear all fields if no author is selected
            $('#author_post_id').val('0');
            // $('#new_author_name').val(''); // Keep commented
            $('#author_subtitle').val('');
            if (tinymce.get('author_content')) {
                tinymce.get('author_content').setContent('');
            } else {
                $('#author_content').val('');
            }
            $('#author_photo_id').val('');
            $('#author_photo_url').val('');
            $('#author-image-preview img').attr('src', '');
            $('#author-image-preview').hide();
            $('#footer_position').val('');
            $('#insert_link').val('');
        }
    });

    // Handle form submission (for actions like delete, publish, save)
    $('#author-editor-form').on('submit', function(e) {
        // Ensure TinyMCE content is saved back to the textarea before submission
        if (typeof tinymce != 'undefined' && tinymce.activeEditor && !tinymce.activeEditor.isHidden()) {
            tinymce.activeEditor.save();
        }

        // Handle specific actions like delete with a confirmation
        var selectedAction = $('#submit_author_action_select').val();
        if (selectedAction === 'delete') {
            if (!confirm(myAuthorEditorAjax.alert_confirm_delete)) {
                e.preventDefault(); // Stop form submission if user cancels
            }
        }
    });
});